import os
import hashlib
import numpy as np
from typing import List, Union

class BaseEmbedder:
    """Base interface for dense vector embeddings."""
    def embed_documents(self, texts: List[str]) -> np.ndarray:
        raise NotImplementedError

    def embed_query(self, text: str) -> np.ndarray:
        raise NotImplementedError

    @property
    def dimension(self) -> int:
        return 384


class SentenceTransformerEmbedder(BaseEmbedder):
    """Embedder using SentenceTransformers (e.g. all-MiniLM-L6-v2 or bge-small-en-v1.5)."""
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self._dim = self.model.get_sentence_embedding_dimension()

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings

    def embed_query(self, text: str) -> np.ndarray:
        embedding = self.model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
        return embedding

    @property
    def dimension(self) -> int:
        return self._dim


class HashedFeatureEmbedder(BaseEmbedder):
    """
    High-performance, deterministic subword hash-projected dense embedder (384-d).
    Zero-network dependency, sub-millisecond execution, L2-normalized for exact cosine similarity.
    """
    def __init__(self, dimension: int = 384):
        self._dim = dimension

    def _text_to_vector(self, text: str) -> np.ndarray:
        vec = np.zeros(self._dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            return vec

        # Bag-of-words and 3-char n-grams hashing
        for word in words:
            # Word token hash
            h_val = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h_val % self._dim
            sign = 1.0 if (h_val >> 8) % 2 == 0 else -1.0
            vec[idx] += sign

            # 3-char ngrams
            if len(word) >= 3:
                for i in range(len(word) - 2):
                    ngram = word[i:i+3]
                    nh = int(hashlib.sha256(ngram.encode('utf-8')).hexdigest(), 16)
                    nidx = nh % self._dim
                    nsign = 1.0 if (nh >> 8) % 2 == 0 else -1.0
                    vec[nidx] += nsign * 0.5

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 1e-9:
            vec = vec / norm
        return vec

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        vectors = [self._text_to_vector(t) for t in texts]
        return np.array(vectors, dtype=np.float32)

    def embed_query(self, text: str) -> np.ndarray:
        return self._text_to_vector(text)

    @property
    def dimension(self) -> int:
        return self._dim


def get_default_embedder() -> BaseEmbedder:
    """
    Factory to load SentenceTransformers if available, otherwise defaulting to
    the zero-latency HashedFeatureEmbedder.
    """
    try:
        # Check if sentence_transformers is importable
        import sentence_transformers
        model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        return SentenceTransformerEmbedder(model_name=model_name)
    except Exception:
        return HashedFeatureEmbedder(dimension=384)
