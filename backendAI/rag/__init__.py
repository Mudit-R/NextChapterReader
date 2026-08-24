"""
NextChapter RAG (Retrieval-Augmented Generation) Subsystem
"""
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
from .engine import RAGEngine

__all__ = [
    "PageTextItem",
    "IngestDocumentRequest",
    "IngestResponse",
    "RAGQueryRequest",
    "RAGQueryResponse",
    "CitationChunk",
    "SearchChunkResult",
    "RAGStatsResponse",
    "RAGEngine"
]
