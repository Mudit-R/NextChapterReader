"""
Tests for NextChapter streaming RAG generation and faithfulness evaluation.
"""
from fastapi.testclient import TestClient
from main import app, rag_engine
from rag.models import PageTextItem, IngestDocumentRequest


client = TestClient(app)


def setup_module():
    # Ingest a test book for streaming tests
    sample_pages = [
        PageTextItem(
            page_number=1,
            text="The ancient archives of Alexandria contained over 400,000 papyrus scrolls.",
            chapter_title="Chapter 1"
        ),
        PageTextItem(
            page_number=2,
            text="Hypatia taught mathematics and astronomy to students from across the Mediterranean.",
            chapter_title="Chapter 1"
        )
    ]
    req = IngestDocumentRequest(
        book_id="alexandria_01",
        book_title="The Lost Library",
        pages=sample_pages
    )
    rag_engine.ingest_document(req)


def test_streaming_rag_endpoint():
    """Verify Server-Sent Events (SSE) streaming token delivery."""
    payload = {
        "message": "How many scrolls were in Alexandria?",
        "book_id": "alexandria_01",
        "current_page": 2,
        "enable_anti_spoiler": True
    }
    response = client.post("/api/rag/query/stream", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    
    text = response.text
    assert "data: " in text
    assert '"type": "done"' in text or '"type": "token"' in text


def test_rag_faithfulness_evaluation_endpoint():
    """Verify RAG Triad evaluation metrics endpoint."""
    payload = {
        "query": "What did Hypatia teach in Alexandria?",
        "book_id": "alexandria_01",
        "current_page": 2
    }
    response = client.post("/api/rag/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "context_relevance_score" in data
    assert "groundedness_score" in data
    assert "overall_faithfulness_score" in data
    assert data["citations_count"] >= 1
