import os
import re
from typing import List, Optional, Dict, Any
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

load_dotenv()


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
 self.groq_client = None

 self._cached_model = None
 if self.api_key:
 try:
 from groq import Groq
 self.groq_client = Groq(api_key=self.api_key)
 except Exception as e:
 print(f"️ Groq client initialization warning: {e}")

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

 def query(self, req: RAGQueryRequest) -> RAGQueryResponse:
        """
 Execute full RAG pipeline:
 1. Metadata-filtered retrieval (with Anti-Spoiler constraint if enabled).
 2. Reranking.
 3. Contextual prompt assembly.
 4. Groq Llama 3.1 grounded synthesis.
 5. Citation extraction.
        """
 # Determine spoiler boundary
 max_page = None
 spoiler_guard_active = False
 if req.enable_anti_spoiler and req.current_page > 0:
 max_page = req.current_page
 spoiler_guard_active = True

 # 1. Retrieve candidates
 raw_candidates = self.vector_store.search(
 query=req.message,
 book_id=req.book_id or req.book_title,
 max_page=max_page,
 top_k=req.top_k * 2
        )

 # 2. Rerank candidates
 top_chunks = self.reranker.rerank(req.message, raw_candidates, top_n=req.top_k)

 # Fallback if no chunks indexed or retrieved
 if not top_chunks:
 return self._generate_fallback_response(req, spoiler_guard_active)

 # 3. Build Grounded Context Prompt
 context_blocks = []
 citations: List[CitationChunk] = []

 for idx, (chunk, score) in enumerate(top_chunks):
 context_blocks.append(f"[PASSAGE {idx+1} | Page {chunk.page_number}]:\n{chunk.text}")
 citations.append(
 CitationChunk(
 chunk_id=chunk.chunk_id,
 page_number=chunk.page_number,
 text_excerpt=chunk.text[:160] + "..." if len(chunk.text) > 160 else chunk.text,
 relevance_score=round(score, 3)
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

 # 4. Generate answer via Groq LLM
 model_name = self._resolve_groq_model()
 ai_response = ""

 if self.groq_client:
 try:
 response = self.groq_client.chat.completions.create(
 model=model_name,
 messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": req.message}
                    ],
 temperature=0.3,
 max_tokens=600
                )
 raw_text = response.choices[0].message.content or ""
 ai_response = self._clean_response_text(raw_text)
 except Exception as e:
 print(f"Error calling Groq API: {e}")
 ai_response = f"Grounded Context Found ({len(citations)} passages on pages {', '.join(str(c.page_number) for c in citations)}). Note: LLM synthesis encountered an API issue ({str(e)})."
 else:
 # Local synthesis when Groq API key is not configured
 top_passages_summary = "\n\n".join([f"• Page {c.page_number}: \"{c.text_excerpt}\"" for c in citations[:3]])
 ai_response = f"Based on retrieved passages from the book (Pages {', '.join(str(c.page_number) for c in citations)}):\n\n{top_passages_summary}"

 return RAGQueryResponse(
 response=ai_response,
 citations=citations,
 spoiler_guard_active=spoiler_guard_active,
 retrieval_method="hybrid_dense_sparse_rag_with_reranking",
 model_used=model_name
        )

 def _generate_fallback_response(self, req: RAGQueryRequest, spoiler_guard: bool) -> RAGQueryResponse:
        """Handle cases where no book text has been indexed yet."""
 system_prompt = f"""You are a helpful reading assistant for the book "{req.book_title}".
The user is currently on page {req.current_page}.
Answer concisely about the book's general themes, characters, or reading comprehension."""

 model_name = self._resolve_groq_model()
 if self.groq_client:
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
 raw_text = response.choices[0].message.content or ""
 return RAGQueryResponse(
 response=self._clean_response_text(raw_text),
 citations=[],
 spoiler_guard_active=spoiler_guard,
 retrieval_method="zero_shot_parametric_fallback",
 model_used=model_name
                )
 except Exception as e:
 return RAGQueryResponse(
 response=f"I'm ready to answer questions about {req.book_title}. Ingest the book text for page-level grounded citations! (Error: {str(e)})",
 citations=[],
 spoiler_guard_active=spoiler_guard,
 retrieval_method="none",
 model_used=model_name
                )

 return RAGQueryResponse(
 response=f"I'm your assistant for '{req.book_title}'. Index the book into the NextChapter RAG engine to unlock exact page citations and spoiler-free Q&A!",
 citations=[],
 spoiler_guard_active=spoiler_guard,
 retrieval_method="none",
 model_used="none"
        )

 def get_stats(self) -> RAGStatsResponse:
        """Return index statistics."""
 raw_stats = self.vector_store.get_stats()
 return RAGStatsResponse(**raw_stats)
