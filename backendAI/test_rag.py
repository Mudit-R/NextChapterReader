"""
Verification Test Suite for NextChapter RAG Pipeline
"""
import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
 sys.stdout.reconfigure(encoding='utf-8')

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag.models import PageTextItem, IngestDocumentRequest, RAGQueryRequest
from rag.engine import RAGEngine
from rag.evaluator import RAGEvaluator


def run_rag_tests():
 print("==================================================")
 print(" Starting NextChapter RAG Verification Tests")
 print("==================================================")

 # 1. Initialize Engine
 engine = RAGEngine()
 print(" RAG Engine initialized.")

 # 2. Ingest Sample Multi-Page Book Content
 sample_pages = [
 PageTextItem(
 page_number=1,
 text="Chapter 1: The Quantum Anomaly. Dr. Elena Vance discovered a localized temporal distortion in the subterranean lab at 04:00 hours. The resonance frequency matched 432.8 MHz.",
 chapter_title="Chapter 1"
        ),
 PageTextItem(
 page_number=2,
 text="Elena called Marcus Thorne, the chief engineer of the observatory. Together they calibrated the primary flux stabilizer using neodymium alloy plates. They realized the energy signature came from the deep core.",
 chapter_title="Chapter 1"
        ),
 PageTextItem(
 page_number=3,
 text="Chapter 2: The Core Descent. Elena and Marcus traveled 3,000 meters beneath the surface. Marcus warned that the ambient temperature was approaching 85 degrees Celsius, threatening the primary coolant loop.",
 chapter_title="Chapter 2"
        ),
 PageTextItem(
 page_number=4,
 text="Spoiler Alert: In Chapter 3, Elena discovers that Marcus was secretly working for the Syndicate and sabotaged the secondary coolant pump to extract the anomaly artifact for himself.",
 chapter_title="Chapter 3"
        )
    ]

 ingest_req = IngestDocumentRequest(
 book_id="quantum_chronicles_01",
 book_title="The Quantum Chronicles",
 author="E. Vance",
 pages=sample_pages,
 chunk_size=300,
 chunk_overlap=60
    )

 ingest_res = engine.ingest_document(ingest_req)
 print(f" Ingested Book: {ingest_res.book_title} -> {ingest_res.chunks_indexed} chunks indexed across {ingest_res.pages_processed} pages.")
 assert ingest_res.chunks_indexed >= 4, "Expected at least 4 chunks indexed."

 # 3. Test Raw Hybrid Search
 search_results = engine.search_chunks(
 query="What resonance frequency was measured in the lab?",
 book_id="quantum_chronicles_01",
 top_k=2
    )
 print(f"\n Search Query: 'What resonance frequency was measured in the lab?'")
 print(f"   Top result: Page {search_results[0].page_number} | Text: {search_results[0].text[:80]}...")
 assert search_results[0].page_number == 1, "Expected top result to be from Page 1."
 assert "432.8 MHz" in search_results[0].text, "Expected '432.8 MHz' in retrieved chunk."
 print(" Search retrieval verification passed.")

 # 4. Test Anti-Spoiler Metadata Filter (Reader on Page 2 asking about Marcus)
 print("\n️ Testing Anti-Spoiler Guardrail...")
 # Query with reader on page 2 (anti-spoiler enabled)
 safe_query_req = RAGQueryRequest(
 message="What is Marcus Thorne doing and who is he?",
 book_id="quantum_chronicles_01",
 current_page=2,
 enable_anti_spoiler=True
    )
 safe_res = engine.query(safe_query_req)
 cited_pages = [c.page_number for c in safe_res.citations]
 print(f"   Reader on Page 2 | Cited pages: {cited_pages}")
 assert all(p <= 2 for p in cited_pages), f"Spoiler leak detected! Retrieved page > 2: {cited_pages}"
 assert 4 not in cited_pages, "Spoiler leak! Page 4 (Syndicate plot twist) was retrieved when reader was on Page 2!"
 print(" Anti-Spoiler Guardrail successfully prevented future chapter leakage.")

 # 5. Test Query with Reader on Page 4 (All pages unlocked)
 unlocked_query_req = RAGQueryRequest(
 message="What did Marcus secretly do?",
 book_id="quantum_chronicles_01",
 current_page=4,
 enable_anti_spoiler=True
    )
 unlocked_res = engine.query(unlocked_query_req)
 unlocked_cited_pages = [c.page_number for c in unlocked_res.citations]
 print(f"   Reader on Page 4 | Cited pages: {unlocked_cited_pages}")
 assert 4 in unlocked_cited_pages, "Expected Page 4 to be cited when reader reached Page 4."
 print(" Unlocked retrieval verification passed.")

 # 6. Test RAG Triad Evaluation Suite
 print("\n Running RAG Triad Faithfulness & Groundedness Benchmark...")
 evaluator = RAGEvaluator(engine=engine)
 benchmark_cases = [
        {"query": "What frequency was detected in the anomaly?", "book_id": "quantum_chronicles_01", "current_page": 2},
        {"query": "What alloy was used for the flux stabilizer?", "book_id": "quantum_chronicles_01", "current_page": 2},
        {"query": "What was the ambient temperature during the core descent?", "book_id": "quantum_chronicles_01", "current_page": 3}
    ]
 bench_results = evaluator.run_benchmark_suite(benchmark_cases)
 print(f"   Evaluated Queries: {bench_results['total_eval_queries']}")
 print(f"   Mean Context Relevance: {bench_results['mean_context_relevance'] * 100:.1f}%")
 print(f"   Mean Groundedness: {bench_results['mean_groundedness'] * 100:.1f}%")
 print(f"   Overall RAG Triad Score: {bench_results['mean_rag_triad_score'] * 100:.1f}%")

 assert bench_results["mean_context_relevance"] > 0.6, "Context relevance below threshold."
 print(" RAG Triad evaluation benchmark passed.")

 # 7. Check Engine Stats
 stats = engine.get_stats()
 print(f"\n Store Stats: {stats.total_books} books, {stats.total_chunks} chunks indexed.")
 assert stats.total_books == 1
 assert stats.total_chunks == ingest_res.chunks_indexed

 print("\n==================================================")
 print(" ALL RAG PIPELINE TESTS PASSED WITH 100% SUCCESS!")
 print("==================================================")


if __name__ == "__main__":
 run_rag_tests()
