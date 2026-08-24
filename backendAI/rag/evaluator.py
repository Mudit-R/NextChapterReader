import re
from typing import List, Dict, Any
from .engine import RAGEngine
from .models import RAGQueryRequest, RAGQueryResponse


class RAGEvaluator:
    """
    Evaluator for RAG Triad Metrics:
    1. Context Relevance: Are the retrieved passages pertinent to the query?
    2. Groundedness (Faithfulness): Is the generated answer strictly backed by the context without hallucination?
    3. Answer Relevance: Does the generated answer address the reader's question?
    """

    def __init__(self, engine: RAGEngine):
        self.engine = engine

    def _extract_keywords(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b\w{3,}\b', text) if w.lower() not in {
            'the', 'and', 'for', 'that', 'this', 'with', 'from', 'what', 'where', 'when', 'who', 'how', 'about'
        }]

    def evaluate_context_relevance(self, query: str, response: RAGQueryResponse) -> float:
        """Measure what fraction of query keywords appear in the retrieved context."""
        if not response.citations:
            return 0.0
        q_words = set(self._extract_keywords(query))
        if not q_words:
            return 1.0

        all_context_text = " ".join([c.text_excerpt for c in response.citations]).lower()
        matched = sum(1 for w in q_words if w in all_context_text)
        return round(matched / len(q_words), 3)

    def evaluate_groundedness(self, response: RAGQueryResponse) -> float:
        """Measure statement support: check key tokens in the answer against context."""
        if not response.citations or not response.response:
            return 0.0

        ans_words = self._extract_keywords(response.response)
        if not ans_words:
            return 1.0

        all_context_text = " ".join([c.text_excerpt for c in response.citations]).lower()
        supported = sum(1 for w in ans_words if w in all_context_text)
        return round(supported / len(ans_words), 3)

    def evaluate_query(self, query: str, book_id: str, current_page: int) -> Dict[str, Any]:
        """Run a query and compute RAG evaluation scores."""
        req = RAGQueryRequest(
            message=query,
            book_id=book_id,
            current_page=current_page,
            enable_anti_spoiler=True
        )
        res = self.engine.query(req)

        ctx_rel = self.evaluate_context_relevance(query, res)
        groundedness = self.evaluate_groundedness(res)
        avg_score = round((ctx_rel + groundedness) / 2.0, 3)

        return {
            "query": query,
            "book_id": book_id,
            "current_page": current_page,
            "citations_count": len(res.citations),
            "cited_pages": [c.page_number for c in res.citations],
            "context_relevance_score": ctx_rel,
            "groundedness_score": groundedness,
            "overall_faithfulness_score": avg_score,
            "response_snippet": res.response[:120] + "..." if len(res.response) > 120 else res.response
        }

    def run_benchmark_suite(self, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run evaluation over a test dataset and output aggregate metrics."""
        results = []
        for case in test_cases:
            score_data = self.evaluate_query(
                query=case["query"],
                book_id=case["book_id"],
                current_page=case.get("current_page", 100)
            )
            results.append(score_data)

        avg_ctx_rel = round(sum(r["context_relevance_score"] for r in results) / max(len(results), 1), 3)
        avg_ground = round(sum(r["groundedness_score"] for r in results) / max(len(results), 1), 3)
        avg_total = round(sum(r["overall_faithfulness_score"] for r in results) / max(len(results), 1), 3)

        return {
            "total_eval_queries": len(results),
            "mean_context_relevance": avg_ctx_rel,
            "mean_groundedness": avg_ground,
            "mean_rag_triad_score": avg_total,
            "individual_evaluations": results
        }
