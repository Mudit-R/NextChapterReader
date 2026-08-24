import os
import sys
import traceback
from typing import Optional, List

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from rag.models import (
    PageTextItem,
    IngestDocumentRequest,
    IngestResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    CitationChunk,
    SearchChunkResult,
    RAGStatsResponse
)
from rag.engine import RAGEngine

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None

if API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=API_KEY)
        print("✅ Groq client initialized successfully.")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize Groq client: {e}")
else:
    print("⚠️ GROQ_API_KEY not set. RAG will operate with local grounded retrieval.")

# Initialize RAG Engine
rag_engine = RAGEngine(groq_api_key=API_KEY)

app = FastAPI(
    title="NextChapter AI & RAG Backend",
    description="Microservices for Content Moderation, In-Book Grounded RAG Q&A, and Cover Art Generation",
    version="2.0.0"
)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommentRequest(BaseModel):
    text: str


class ModerationResult(BaseModel):
    is_appropriate: bool
    message: str
    reasons: List[str] = []


class ChatRequest(BaseModel):
    message: str
    book_id: Optional[str] = None
    book_title: str = ""
    current_page: int = 1
    total_pages: int = 0
    enable_anti_spoiler: bool = True


class ChatResponse(BaseModel):
    response: str
    citations: List[CitationChunk] = []
    spoiler_guard_active: bool = False
    retrieval_method: str = "hybrid_rag"


class ImageRequest(BaseModel):
    prompt: str
    book_title: str = ""
    current_page: int = 1
    size: str = "1024x1024"


class ImageResponse(BaseModel):
    image_url: str
    prompt: str


# ==========================================
# 1. RAG (Retrieval-Augmented Generation) API
# ==========================================

@app.post("/api/rag/ingest", response_model=IngestResponse)
async def rag_ingest_book(request: IngestDocumentRequest):
    """
    Ingest a book's extracted pages, run sliding-window semantic chunking, 
    generate embeddings, and index into the hybrid vector store.
    """
    try:
        if not request.pages:
            raise HTTPException(status_code=400, detail="No pages provided for ingestion.")
        
        result = rag_engine.ingest_document(request)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@app.post("/api/rag/query", response_model=RAGQueryResponse)
async def rag_query_book(request: RAGQueryRequest):
    """
    Execute grounded RAG query against book content with anti-spoiler metadata filtering.
    """
    try:
        result = rag_engine.query(request)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RAG query error: {str(e)}")


@app.post("/api/rag/search", response_model=List[SearchChunkResult])
async def rag_search_raw(query: str, book_id: Optional[str] = None, max_page: Optional[int] = None, top_k: int = 5):
    """
    Retrieve top-K matching chunks using hybrid dense + sparse BM25 retrieval without LLM synthesis.
    """
    try:
        return rag_engine.search_chunks(query=query, book_id=book_id, max_page=max_page, top_k=top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rag/status", response_model=RAGStatsResponse)
async def rag_status():
    """Return index statistics and status."""
    return rag_engine.get_stats()


# ==========================================
# 2. In-Book Chat Assistant (RAG Powered)
# ==========================================

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Unified chat endpoint. If the book is indexed in the RAG store, performs grounded
    retrieval with page citations. Otherwise falls back to parametric model memory.
    """
    try:
        print(f"Received chat request: {request.message[:60]}... | Book: {request.book_title} | Page: {request.current_page}")

        rag_req = RAGQueryRequest(
            message=request.message,
            book_id=request.book_id or request.book_title,
            book_title=request.book_title,
            current_page=request.current_page,
            total_pages=request.total_pages,
            enable_anti_spoiler=request.enable_anti_spoiler,
            top_k=4
        )

        rag_res = rag_engine.query(rag_req)

        return ChatResponse(
            response=rag_res.response,
            citations=rag_res.citations,
            spoiler_guard_active=rag_res.spoiler_guard_active,
            retrieval_method=rag_res.retrieval_method
        )

    except Exception as e:
        print(f"Error in chat endpoint: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 3. Content Moderation
# ==========================================

@app.post("/api/moderate", response_model=ModerationResult)
async def moderate_comment(comment: CommentRequest):
    try:
        if not groq_client:
            return ModerationResult(
                is_appropriate=True,
                message="Comment allowed (Moderation offline)",
                reasons=[]
            )

        system_prompt = """
You are a STRICT content moderation engine.

You must output EXACTLY one of the following:

APPROVED

or

REJECTED: <comma-separated reasons>

Reject ANY content with:
- insults (idiot, stupid, dumb, moron, loser, trash, etc.)
- harassment, threats, bullying
- hate speech or discrimination
- explicit or sexual content
- violence or physical harm
- self-harm or suicide talk
- illegal activity
- profanity, rude or abusive language
- harmful opinions that attack people
"""

        model_to_use = rag_engine._resolve_groq_model() if rag_engine else "allam-2-7b"
        response = groq_client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": comment.text},
            ],
            temperature=0,
            max_tokens=60,
        )

        raw_result = response.choices[0].message.content or ""
        result = rag_engine._clean_response_text(raw_result).strip()

        if result == "APPROVED":
            return ModerationResult(
                is_appropriate=True,
                message="Comment allowed",
                reasons=[]
            )

        if result.startswith("REJECTED:"):
            reasons = result.split(":", 1)[1].strip().split(",")
            reasons = [r.strip() for r in reasons if r.strip()]

            return ModerationResult(
                is_appropriate=False,
                message="Comment rejected",
                reasons=reasons
            )

        return ModerationResult(
            is_appropriate=False,
            message="Comment rejected (unexpected model output)",
            reasons=["unclassified"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 4. Visual Cover Art Generation
# ==========================================

@app.post("/api/generate-image", response_model=ImageResponse)
async def generate_image(request: ImageRequest):
    """
    Generate an artistic visualization based on a text prompt using Pollinations.ai.
    """
    try:
        enhanced_prompt = f"{request.prompt}. Book: {request.book_title}, Page: {request.current_page}. High quality, detailed, artistic visualization."
        
        width, height = 1024, 1024
        if 'x' in request.size:
            try:
                w, h = request.size.split('x')
                width, height = int(w), int(h)
            except Exception:
                pass
        
        import urllib.parse
        encoded_prompt = urllib.parse.quote(enhanced_prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&enhance=true"
        
        return ImageResponse(
            image_url=image_url,
            prompt=enhanced_prompt
        )
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Local development only
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
