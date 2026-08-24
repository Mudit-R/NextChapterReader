import re
from typing import List, Tuple
from .chunker import TextChunk


class Reranker:
    """
    Reranker using lexical overlap, term proximity, and hybrid reciprocal scoring.
    Enhances top-K candidate quality before passing context to Groq Llama 3.1.
    """

    def __init__(self):
        pass

    def _tokenize(self, text: str) -> List[str]:
        return [w for w in re.findall(r'\b\w+\b', text.lower()) if len(w) > 2]

    def score_relevance(self, query: str, chunk_text: str, base_hybrid_score: float) -> float:
        """Compute fine-grained relevance score."""
        q_tokens = set(self._tokenize(query))
        if not q_tokens:
            return base_hybrid_score

        doc_tokens = self._tokenize(chunk_text)
        if not doc_tokens:
            return 0.0

        # Exact token match ratio
        matched_tokens = q_tokens.intersection(doc_tokens)
        token_coverage = len(matched_tokens) / max(len(q_tokens), 1)

        # Exact phrase bonus (e.g. multi-word terms appearing consecutively)
        clean_q = query.lower().strip()
        phrase_bonus = 0.25 if clean_q in chunk_text.lower() else 0.0

        # Final reranked score
        reranked_score = 0.5 * base_hybrid_score + 0.35 * token_coverage + phrase_bonus
        return float(min(reranked_score, 1.0))

    def rerank(
        self,
        query: str,
        candidates: List[Tuple[TextChunk, float, float, float]],
        top_n: int = 4
    ) -> List[Tuple[TextChunk, float]]:
        """
        Reranks a list of candidate chunks and returns the top_n (chunk, rerank_score).
        """
        if not candidates:
            return []

        scored_candidates = []
        for chunk, dense_s, sparse_s, hybrid_s in candidates:
            score = self.score_relevance(query, chunk.text, hybrid_s)
            scored_candidates.append((chunk, score))

        # Sort by rerank score descending
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return scored_candidates[:top_n]
