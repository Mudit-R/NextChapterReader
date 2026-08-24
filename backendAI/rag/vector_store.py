import math
import re
from collections import Counter
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from .chunker import TextChunk
from .embeddings import BaseEmbedder, get_default_embedder


class BM25Index:
    """Fast, self-contained BM25 Okapi sparse keyword retrieval."""
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_len: List[int] = []
        self.avg_doc_len: float = 0.0
        self.doc_freqs: List[Counter] = []
        self.idf: Dict[str, float] = {}
        self.num_docs: int = 0

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b\w+\b', text.lower())

    def fit(self, documents: List[str]):
        self.num_docs = len(documents)
        if self.num_docs == 0:
            return

        self.doc_len = []
        self.doc_freqs = []
        df: Dict[str, int] = Counter()

        for doc in documents:
            tokens = self._tokenize(doc)
            self.doc_len.append(len(tokens))
            tf = Counter(tokens)
            self.doc_freqs.append(tf)
            for word in tf.keys():
                df[word] += 1

        self.avg_doc_len = sum(self.doc_len) / max(self.num_docs, 1)
        self.idf = {}
        for word, freq in df.items():
            # BM25 IDF with smoothing
            self.idf[word] = math.log(1.0 + (self.num_docs - freq + 0.5) / (freq + 0.5))

    def score_query(self, query: str) -> np.ndarray:
        scores = np.zeros(self.num_docs, dtype=np.float32)
        q_tokens = self._tokenize(query)
        if not q_tokens or self.num_docs == 0:
            return scores

        for idx in range(self.num_docs):
            doc_tf = self.doc_freqs[idx]
            doc_len = self.doc_len[idx]
            score = 0.0
            for token in q_tokens:
                if token in doc_tf:
                    tf = doc_tf[token]
                    numerator = self.idf.get(token, 0.0) * tf * (self.k1 + 1.0)
                    denominator = tf + self.k1 * (1.0 - self.b + self.b * (doc_len / max(self.avg_doc_len, 1e-6)))
                    score += numerator / max(denominator, 1e-6)
            scores[idx] = score

        # Normalize BM25 scores to [0, 1] range
        max_score = np.max(scores) if len(scores) > 0 else 0.0
        if max_score > 1e-6:
            scores = scores / max_score
        return scores


class HybridVectorStore:
    """
    Hybrid Vector Store with dense vector cosine similarity and sparse BM25 indexing.
    Supports strict metadata filtering for book IDs and Anti-Spoiler page boundaries.
    """

    def __init__(self, embedder: Optional[BaseEmbedder] = None):
        self.embedder = embedder or get_default_embedder()
        self.chunks: List[TextChunk] = []
        self.embeddings: Optional[np.ndarray] = None
        self.bm25 = BM25Index()
        self._book_registry: Dict[str, Dict[str, Any]] = {}

    def add_chunks(self, chunks: List[TextChunk]):
        """Index a list of text chunks."""
        if not chunks:
            return

        # Track existing IDs to avoid duplicate indexing
        existing_ids = {c.chunk_id for c in self.chunks}
        new_chunks = [c for c in chunks if c.chunk_id not in existing_ids]
        if not new_chunks:
            return

        start_idx = len(self.chunks)
        self.chunks.extend(new_chunks)

        # Compute dense embeddings
        texts = [c.text for c in new_chunks]
        new_embeddings = self.embedder.embed_documents(texts)

        if self.embeddings is None or len(self.embeddings) == 0:
            self.embeddings = new_embeddings
        else:
            self.embeddings = np.vstack([self.embeddings, new_embeddings])

        # Re-fit BM25 on all chunks
        all_texts = [c.text for c in self.chunks]
        self.bm25.fit(all_texts)

        # Update book metadata registry
        for c in new_chunks:
            if c.book_id not in self._book_registry:
                self._book_registry[c.book_id] = {
                    "book_id": c.book_id,
                    "book_title": c.book_title,
                    "author": c.author,
                    "chunk_count": 0,
                    "pages": set(),
                }
            self._book_registry[c.book_id]["chunk_count"] += 1
            self._book_registry[c.book_id]["pages"].add(c.page_number)

    def search(
        self,
        query: str,
        book_id: Optional[str] = None,
        max_page: Optional[int] = None,
        top_k: int = 5,
        alpha: float = 0.6
    ) -> List[Tuple[TextChunk, float, float, float]]:
        """
        Hybrid search combining Dense Cosine Similarity and Sparse BM25.
        
        Args:
            query: Question or search string.
            book_id: Filter by target book ID.
            max_page: Anti-spoiler filter (only returns chunks with page_number <= max_page).
            top_k: Number of candidates to return.
            alpha: Weight for dense score (1.0 = dense only, 0.0 = BM25 only, 0.6 = balanced hybrid).
            
        Returns:
            List of (TextChunk, dense_score, sparse_score, hybrid_combined_score)
        """
        if not self.chunks or self.embeddings is None:
            return []

        # 1. Compute Dense similarity
        query_vec = self.embedder.embed_query(query)
        # Cosine similarity (both query and doc vectors are normalized)
        dense_scores = np.dot(self.embeddings, query_vec)
        # Normalize dense score to [0, 1]
        dense_scores = np.clip((dense_scores + 1.0) / 2.0, 0.0, 1.0)

        # 2. Compute Sparse BM25 score
        sparse_scores = self.bm25.score_query(query)

        # 3. Hybrid fusion score
        hybrid_scores = alpha * dense_scores + (1.0 - alpha) * sparse_scores

        # 4. Filter and Rank
        results: List[Tuple[TextChunk, float, float, float]] = []
        
        # Sort indices by hybrid score descending
        ranked_indices = np.argsort(hybrid_scores)[::-1]

        for idx in ranked_indices:
            chunk = self.chunks[idx]
            
            # Apply book_id filter
            if book_id and chunk.book_id != book_id:
                # Also allow fuzzy title match if book_id was passed as title
                if chunk.book_title.lower() != book_id.lower():
                    continue

            # Apply Anti-Spoiler max_page filter
            if max_page is not None and chunk.page_number > max_page:
                continue

            results.append((
                chunk,
                float(dense_scores[idx]),
                float(sparse_scores[idx]),
                float(hybrid_scores[idx])
            ))

            if len(results) >= top_k:
                break

        return results

    def get_stats(self) -> Dict[str, Any]:
        """Return store summary stats."""
        books_summary = []
        for b_id, meta in self._book_registry.items():
            books_summary.append({
                "book_id": b_id,
                "book_title": meta["book_title"],
                "author": meta["author"],
                "chunk_count": meta["chunk_count"],
                "total_pages": len(meta["pages"])
            })

        return {
            "total_books": len(self._book_registry),
            "total_chunks": len(self.chunks),
            "books": books_summary,
            "embedding_dimension": self.embedder.dimension,
            "vector_store_type": "Hybrid Dense-Sparse (Cosine + BM25 Okapi)"
        }
