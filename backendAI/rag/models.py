from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PageTextItem(BaseModel):
    """Represents text extracted from a single book/document page."""
    page_number: int = Field(..., description="1-indexed page number")
    text: str = Field(..., description="Raw text extracted from this page")
    chapter_title: Optional[str] = Field(default=None, description="Optional chapter heading if identified")


class IngestDocumentRequest(BaseModel):
    """Payload to ingest an entire book or batch of pages into the RAG vector index."""
    book_id: str = Field(..., description="Unique identifier for the book")
    book_title: str = Field(..., description="Title of the book")
    author: Optional[str] = Field(default="Unknown Author", description="Author of the book")
    pages: List[PageTextItem] = Field(..., description="List of page text objects")
    chunk_size: int = Field(default=600, description="Character chunk size for sliding window")
    chunk_overlap: int = Field(default=120, description="Character overlap between consecutive chunks")


class IngestResponse(BaseModel):
    """Response returned after successful ingestion and indexing."""
    book_id: str
    book_title: str
    pages_processed: int
    chunks_indexed: int
    status: str = "success"
    message: str


class CitationChunk(BaseModel):
    """Specific passage cited in the grounded LLM answer."""
    chunk_id: str
    page_number: int
    text_excerpt: str
    relevance_score: float = Field(default=0.0, description="Similarity or reranking score")


class RAGQueryRequest(BaseModel):
    """Query request sent by reader with anti-spoiler constraints."""
    message: str = Field(..., description="The user's question or prompt")
    book_id: Optional[str] = Field(default=None, description="Target book identifier")
    book_title: str = Field(default="", description="Book title for context")
    current_page: int = Field(default=1, description="Current page the reader is on")
    total_pages: int = Field(default=0, description="Total pages in the book")
    enable_anti_spoiler: bool = Field(
        default=True, 
        description="If True, restricts retrieval to page <= current_page to prevent spoilers"
    )
    top_k: int = Field(default=4, description="Number of top retrieved passages to include in prompt")


class RAGQueryResponse(BaseModel):
    """Grounded generation response with exact citations."""
    response: str
    citations: List[CitationChunk] = []
    spoiler_guard_active: bool = False
    retrieval_method: str = "hybrid_dense_sparse_rag"
    model_used: str = "llama-3.1-8b-instant"


class SearchChunkResult(BaseModel):
    """Result of direct vector/BM25 retrieval without LLM synthesis."""
    chunk_id: str
    book_id: str
    page_number: int
    text: str
    dense_score: float
    sparse_score: float
    combined_score: float


class RAGStatsResponse(BaseModel):
    """Statistics of current RAG vector index."""
    total_books: int
    total_chunks: int
    books: List[Dict[str, Any]]
    embedding_dimension: int
    vector_store_type: str
