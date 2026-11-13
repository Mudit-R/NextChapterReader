import os
import re
import time
from typing import AsyncIterator, List, Optional, Dict, Any
from dotenv import load_dotenv

from .models import (
    PageTextItem,
    IngestDocumentRequest,
    IngestResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    CitationChunk,
    SearchChunkResult,
    RAGStatsResponse
)
from .chunker import SemanticChunker, TextChunk
from .vector_store import HybridVectorStore
from .reranker import Reranker
from .embeddings import get_default_embedder
from .usage import UsageTracker

load_dotenv()


class _ReasoningTagFilter:
    """Suppress complete or chunk-split <think> blocks in streamed output."""

    _OPEN_TAG = "<think>"
    _CLOSE_TAG = "</think>"

    def __init__(self) -> None:
        self._buffer = ""
        self._inside_block = False

    def feed(self, text: str, final: bool = False) -> str:
        self._buffer += text
        output = []

        while True:
            if self._inside_block:
                closing_index = self._buffer.find(self._CLOSE_TAG)
                if closing_index >= 0:
                    self._buffer = self._buffer[closing_index + len(self._CLOSE_TAG):]
                    self._inside_block = False
                    continue
                if final:
                    self._buffer = ""
                else:
                    keep = len(self._CLOSE_TAG) - 1
                    self._buffer = self._buffer[-keep:]
                break

            opening_index = self._buffer.find(self._OPEN_TAG)
            if opening_index >= 0:
                output.append(self._buffer[:opening_index])
                self._buffer = self._buffer[opening_index + len(self._OPEN_TAG):]
                self._inside_block = True
                continue

            if final:
                output.append(self._buffer)
                self._buffer = ""
            else:
                keep = len(self._OPEN_TAG) - 1
                if len(self._buffer) > keep:
                    output.append(self._buffer[:-keep])
                    self._buffer = self._buffer[-keep:]
            break

        return "".join(output)


class RAGEngine:
    """
    Production-grade RAG engine for NextChapter digital reader.
    Integrates sliding-window chunking, hybrid dense/sparse vector retrieval,
    anti-spoiler page filtering, reranking, and Groq Llama 3.1 grounded generation.
    """

    def __init__(self, groq_api_key: Optional[str] = None):
        self.api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        self.chunker = SemanticChunker(chunk_size=600, chunk_overlap=120)
        self.embedder = get_default_embedder()
        self.vector_store = HybridVectorStore(embedder=self.embedder)
        self.reranker = Reranker()
        self.usage_tracker = UsageTracker()
        self.groq_client = None
        self.async_groq_client = None

        self._cached_model = None
        if self.api_key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"⚠️ Groq client initialization warning: {e}")

    async def _get_async_groq_client(self):
        if self.async_groq_client is not None:
            return self.async_groq_client
        if not self.api_key:
            return None
        try:
            from groq import AsyncGroq
            self.async_groq_client = AsyncGroq(api_key=self.api_key)
        except Exception as e:
            print(f"⚠️ Async Groq client initialization warning: {e}")
        return self.async_groq_client

    async def _resolve_groq_model_async(self) -> str:
        if self._cached_model:
            return self._cached_model
        client = await self._get_async_groq_client()
        if client is None:
            return self._resolve_groq_model()

        preferred_models = [
            "allam-2-7b",
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "qwen/qwen3.6-27b",
            "openai/gpt-oss-20b",
            "llama3-8b-8192",
        ]
        try:
            available = {model.id for model in (await client.models.list()).data}
            for preferred_model in preferred_models:
                if preferred_model in available:
                    self._cached_model = preferred_model
                    return preferred_model
            if available:
                self._cached_model = next(
                    (
                        model for model in available
                        if "whisper" not in model and "guard" not in model
                    ),
                    list(available)[0],
                )
                return self._cached_model
        except Exception:
            pass

        self._cached_model = preferred_models[0]
        return self._cached_model

    async def aclose(self) -> None:
        if self.async_groq_client is not None:
            await self.async_groq_client.close()
            self.async_groq_client = None

    def _resolve_groq_model(self) -> str:
        """Resolve available Groq model dynamically."""
        if self._cached_model:
            return self._cached_model
        
        PREFERRED_MODELS = [
            "allam-2-7b",
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "qwen/qwen3.6-27b",
            "openai/gpt-oss-20b",
            "llama3-8b-8192"
        ]
        
        if self.groq_client:
            try:
                available = {m.id for m in self.groq_client.models.list().data}
                for pm in PREFERRED_MODELS:
                    if pm in available:
                        self._cached_model = pm
                        return pm
                if available:
                    chosen = next((m for m in available if "whisper" not in m and "guard" not in m), list(available)[0])
                    self._cached_model = chosen
                    return chosen
            except Exception:
                pass
        
        self._cached_model = "allam-2-7b"
        return self._cached_model

    @staticmethod
    def _clean_response_text(text: str) -> str:
        """Strip reasoning/thinking blocks if returned by model."""
        if not text:
            return ""
        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
        return cleaned or text.strip()

    def ingest_document(self, req: IngestDocumentRequest) -> IngestResponse:
        """Process and index all pages of a book into the hybrid vector store."""
        # Chunk pages
        chunks = self.chunker.chunk_document(
            book_id=req.book_id,
            book_title=req.book_title,
            author=req.author or "Unknown Author",
            pages=req.pages
        )

        # Index in vector store
        self.vector_store.add_chunks(chunks)

        return IngestResponse(
            book_id=req.book_id,
            book_title=req.book_title,
            pages_processed=len(req.pages),
            chunks_indexed=len(chunks),
            status="success",
            message=f"Successfully indexed {len(chunks)} chunks across {len(req.pages)} pages for '{req.book_title}'."
        )

    def search_chunks(
        self,
        query: str,
        book_id: Optional[str] = None,
        max_page: Optional[int] = None,
        top_k: int = 5
    ) -> List[SearchChunkResult]:
        """Perform raw hybrid search without LLM generation."""
        raw_candidates = self.vector_store.search(
            query=query,
            book_id=book_id,
            max_page=max_page,
            top_k=top_k * 2
        )

        reranked = self.reranker.rerank(query, raw_candidates, top_n=top_k)

        results = []
        for chunk, score in reranked:
            results.append(
                SearchChunkResult(
                    chunk_id=chunk.chunk_id,
                    book_id=chunk.book_id,
                    page_number=chunk.page_number,
                    text=chunk.text,
                    dense_score=0.0,
                    sparse_score=0.0,
                    combined_score=round(score, 4)
                )
            )
        return results

    def _prepare_grounded_context(
        self,
        req: RAGQueryRequest,
    ) -> tuple[bool, float, List[CitationChunk], Optional[str]]:
        retrieval_started_at = time.perf_counter()
        max_page = req.current_page if req.enable_anti_spoiler and req.current_page > 0 else None
        spoiler_guard_active = max_page is not None

        raw_candidates = self.vector_store.search(
            query=req.message,
            book_id=req.book_id or req.book_title,
            max_page=max_page,
            top_k=req.top_k * 2,
        )
        top_chunks = self.reranker.rerank(
            req.message,
            raw_candidates,
            top_n=req.top_k,
        )
        retrieval_ms = (time.perf_counter() - retrieval_started_at) * 1000

        if not top_chunks:
            return spoiler_guard_active, retrieval_ms, [], None

        context_blocks = []
        citations: List[CitationChunk] = []
        for index, (chunk, score) in enumerate(top_chunks):
            context_blocks.append(
                f"[PASSAGE {index + 1} | Page {chunk.page_number}]:\n{chunk.text}"
            )
            citations.append(
                CitationChunk(
                    chunk_id=chunk.chunk_id,
                    page_number=chunk.page_number,
                    text_excerpt=chunk.text[:160] + "..." if len(chunk.text) > 160 else chunk.text,
                    relevance_score=round(score, 3),
                )
            )

        context_text = "\n\n".join(context_blocks)
        system_prompt = f"""You are NextChapter's intelligent in-book reading assistant for "{req.book_title or 'this book'}".
The reader is currently on page {req.current_page}{f' of {req.total_pages}' if req.total_pages > 0 else ''}.

CONTEXT FROM THE BOOK (RETRIEVED PASSAGES):
==================================================
{context_text}
==================================================

STRICT INSTRUCTIONS:
1. Answer the user's question accurately, grounded ONLY in the retrieved passages above.
2. Cite the specific page numbers where your answer is found, using format [Page X].
3. If the answer cannot be found in the provided passages, state clearly: "Based on the text up to page {req.current_page}, this is not mentioned." Do NOT hallucinate or guess outside the provided text.
4. If Anti-Spoiler mode is active, never reveal plot points from future chapters.
5. Keep your tone engaging, concise, and helpful to the reader."""
        return spoiler_guard_active, retrieval_ms, citations, system_prompt

    def query(self, req: RAGQueryRequest) -> RAGQueryResponse:
        """
        Execute full RAG pipeline:
        1. Metadata-filtered retrieval (with Anti-Spoiler constraint if enabled).
        2. Reranking.
        3. Contextual prompt assembly.
        4. Groq Llama 3.1 grounded synthesis.
        5. Citation extraction.
        """
        query_started_at = time.perf_counter()

        spoiler_guard_active, retrieval_ms, citations, system_prompt = self._prepare_grounded_context(req)

        # Fallback if no chunks indexed or retrieved
        if system_prompt is None:
            return self._generate_fallback_response(
                req,
                spoiler_guard_active,
                query_started_at=query_started_at,
                retrieval_ms=retrieval_ms,
            )

        # 4. Generate answer via Groq LLM
        model_name = self._resolve_groq_model()
        ai_response = ""
        usage = None
        model_ms = 0.0

        if self.groq_client:
            try:
                model_started_at = time.perf_counter()
                response = self.groq_client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": req.message}
                    ],
                    temperature=0.3,
                    max_tokens=600
                )
                usage = self.usage_tracker.record(getattr(response, "usage", None), model_name, source="rag_query")
                raw_text = response.choices[0].message.content or ""
                ai_response = self._clean_response_text(raw_text)
            except Exception as e:
                print(f"Error calling Groq API: {e}")
                ai_response = f"Grounded Context Found ({len(citations)} passages on pages {', '.join(str(c.page_number) for c in citations)}). Note: LLM synthesis encountered an API issue ({str(e)})."
            finally:
                model_ms = (time.perf_counter() - model_started_at) * 1000
        else:
            # Local synthesis when Groq API key is not configured
            top_passages_summary = "\n\n".join([f"• Page {c.page_number}: \"{c.text_excerpt}\"" for c in citations[:3]])
            ai_response = f"Based on retrieved passages from the book (Pages {', '.join(str(c.page_number) for c in citations)}):\n\n{top_passages_summary}"

        result = RAGQueryResponse(
            response=ai_response,
            citations=citations,
            spoiler_guard_active=spoiler_guard_active,
            retrieval_method="hybrid_dense_sparse_rag_with_reranking",
            model_used=model_name,
            usage=usage
        )
        return self._finish_query(
            result,
            query_started_at=query_started_at,
            retrieval_ms=retrieval_ms,
            model_ms=model_ms,
        )

    async def stream_query(self, req: RAGQueryRequest) -> AsyncIterator[Dict[str, Any]]:
        """Yield provider-generated content as it arrives, followed by query metadata."""
        query_started_at = time.perf_counter()

        if not self.api_key:
            result = self.query(req)
            if result.response:
                yield {"type": "token", "content": result.response, "index": 0}
            yield {
                "type": "done",
                "citations": [citation.model_dump() for citation in result.citations],
                "spoiler_guard_active": result.spoiler_guard_active,
                "model_used": result.model_used,
                "retrieval_method": result.retrieval_method,
                "usage": result.usage,
                "timings_ms": {
                    **result.timings_ms,
                    "time_to_first_token_ms": None,
                },
            }
            return

        client = await self._get_async_groq_client()
        if client is None:
            result = self.query(req)
            if result.response:
                yield {"type": "token", "content": result.response, "index": 0}
            yield {
                "type": "done",
                "citations": [citation.model_dump() for citation in result.citations],
                "spoiler_guard_active": result.spoiler_guard_active,
                "model_used": result.model_used,
                "retrieval_method": result.retrieval_method,
                "usage": result.usage,
                "timings_ms": {
                    **result.timings_ms,
                    "time_to_first_token_ms": None,
                },
            }
            return

        spoiler_guard_active, retrieval_ms, citations, system_prompt = self._prepare_grounded_context(req)
        if system_prompt is None:
            system_prompt = f"""You are a helpful reading assistant for the book "{req.book_title}".
The user is currently on page {req.current_page}.
Answer concisely about the book's general themes, characters, or reading comprehension."""
            retrieval_method = "zero_shot_parametric_fallback"
        else:
            retrieval_method = "hybrid_dense_sparse_rag_with_reranking"

        model_name = await self._resolve_groq_model_async()
        model_started_at = time.perf_counter()
        first_token_ms = None
        usage = None
        usage_recorded = False
        emitted_tokens = 0
        text_filter = _ReasoningTagFilter()
        stream_error = False

        try:
            stream = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.message},
                ],
                temperature=0.3,
                max_tokens=600,
                stream=True,
            )
            async for chunk in stream:
                groq_metadata = getattr(chunk, "x_groq", None)
                reported_usage = getattr(groq_metadata, "usage", None)
                if reported_usage is not None and not usage_recorded:
                    usage = self.usage_tracker.record(
                        reported_usage,
                        model_name,
                        source="rag_stream",
                    )
                    usage_recorded = usage is not None

                if not chunk.choices:
                    continue
                delta = getattr(chunk.choices[0], "delta", None)
                content = getattr(delta, "content", None)
                if not content:
                    continue

                safe_content = text_filter.feed(content)
                if not safe_content:
                    continue
                if first_token_ms is None:
                    first_token_ms = (time.perf_counter() - model_started_at) * 1000
                yield {
                    "type": "token",
                    "content": safe_content,
                    "index": emitted_tokens,
                }
                emitted_tokens += 1

            trailing_content = text_filter.feed("", final=True)
            if trailing_content:
                if first_token_ms is None:
                    first_token_ms = (time.perf_counter() - model_started_at) * 1000
                yield {
                    "type": "token",
                    "content": trailing_content,
                    "index": emitted_tokens,
                }
        except Exception:
            stream_error = True
            if emitted_tokens == 0:
                fallback_text = (
                    f"Grounded context found in {len(citations)} passages. "
                    "Model generation failed."
                )
                if first_token_ms is None:
                    first_token_ms = (time.perf_counter() - model_started_at) * 1000
                yield {
                    "type": "token",
                    "content": fallback_text,
                    "index": emitted_tokens,
                }
                emitted_tokens += 1
            yield {"type": "error", "error": "Model generation failed."}

        model_ms = (time.perf_counter() - model_started_at) * 1000
        timings_ms = {
            "retrieval_ms": round(max(0.0, retrieval_ms), 3),
            "model_ms": round(max(0.0, model_ms), 3),
            "time_to_first_token_ms": (
                round(max(0.0, first_token_ms), 3)
                if first_token_ms is not None else None
            ),
            "total_ms": round(max(0.0, (time.perf_counter() - query_started_at) * 1000), 3),
        }
        self.usage_tracker.record_latency(timings_ms)
        yield {
            "type": "done",
            "citations": [citation.model_dump() for citation in citations],
            "spoiler_guard_active": spoiler_guard_active,
            "model_used": model_name,
            "retrieval_method": retrieval_method,
            "usage": usage,
            "timings_ms": timings_ms,
            "stream_error": stream_error,
        }

    def _generate_fallback_response(
        self,
        req: RAGQueryRequest,
        spoiler_guard: bool,
        query_started_at: float,
        retrieval_ms: float,
    ) -> RAGQueryResponse:
        """Handle cases where no book text has been indexed yet."""
        system_prompt = f"""You are a helpful reading assistant for the book "{req.book_title}".
The user is currently on page {req.current_page}.
Answer concisely about the book's general themes, characters, or reading comprehension."""

        model_name = self._resolve_groq_model()
        if self.groq_client:
            model_started_at = time.perf_counter()
            try:
                response = self.groq_client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": req.message}
                    ],
                    temperature=0.7,
                    max_tokens=400
                )
                usage = self.usage_tracker.record(getattr(response, "usage", None), model_name, source="fallback")
                raw_text = response.choices[0].message.content or ""
                result = RAGQueryResponse(
                    response=self._clean_response_text(raw_text),
                    citations=[],
                    spoiler_guard_active=spoiler_guard,
                    retrieval_method="zero_shot_parametric_fallback",
                    model_used=model_name,
                    usage=usage
                )
                model_ms = (time.perf_counter() - model_started_at) * 1000
                return self._finish_query(
                    result,
                    query_started_at=query_started_at,
                    retrieval_ms=retrieval_ms,
                    model_ms=model_ms,
                )
            except Exception as e:
                result = RAGQueryResponse(
                    response=f"I'm ready to answer questions about {req.book_title}. Ingest the book text for page-level grounded citations! (Error: {str(e)})",
                    citations=[],
                    spoiler_guard_active=spoiler_guard,
                    retrieval_method="none",
                    model_used=model_name
                )
                model_ms = (time.perf_counter() - model_started_at) * 1000
                return self._finish_query(
                    result,
                    query_started_at=query_started_at,
                    retrieval_ms=retrieval_ms,
                    model_ms=model_ms,
                )

        result = RAGQueryResponse(
            response=f"I'm your assistant for '{req.book_title}'. Index the book into the NextChapter RAG engine to unlock exact page citations and spoiler-free Q&A!",
            citations=[],
            spoiler_guard_active=spoiler_guard,
            retrieval_method="none",
            model_used="none"
        )
        return self._finish_query(
            result,
            query_started_at=query_started_at,
            retrieval_ms=retrieval_ms,
            model_ms=0.0,
        )

    def _finish_query(
        self,
        response: RAGQueryResponse,
        query_started_at: float,
        retrieval_ms: float,
        model_ms: float,
    ) -> RAGQueryResponse:
        timings_ms = {
            "retrieval_ms": round(max(0.0, retrieval_ms), 3),
            "model_ms": round(max(0.0, model_ms), 3),
            "total_ms": round(max(0.0, (time.perf_counter() - query_started_at) * 1000), 3),
        }
        self.usage_tracker.record_latency(timings_ms)
        return response.model_copy(update={"timings_ms": timings_ms})

    def get_stats(self) -> RAGStatsResponse:
        """Return index statistics."""
        raw_stats = self.vector_store.get_stats()
        return RAGStatsResponse(**raw_stats)

    def get_usage_report(self) -> Dict[str, Any]:
        return self.usage_tracker.report()
