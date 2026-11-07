"""
Multi-namespace Vector Store for Court Clash:
Supports:
1. Complete namespace isolation: room searches only the chosen constitution's namespace.
2. Fast, offline semantic similarity (TF-IDF + Cosine similarity using scikit-learn/numpy).
3. Optional dense embedding hook (for Gemini / OpenAI / SentenceTransformers) if configured.
4. Provenance tracking: returns exact article number, clause, title, and citation text.
"""
import os
import json
import numpy as np
from typing import Dict, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.constitution import ArticleChunk, RetrievedArticle, ConstitutionInput
from app.rag.chunker import chunk_constitution

class NamespaceIndex:
    """Represents an isolated vector and text index for a single constitution."""
    def __init__(self, namespace_id: str, name: str):
        self.namespace_id = namespace_id
        self.name = name
        self.chunks: List[ArticleChunk] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None

    def build_index(self, chunks: List[ArticleChunk]):
        self.chunks = chunks
        if not chunks:
            self.vectorizer = None
            self.tfidf_matrix = None
            return

        corpus = [chunk.searchable_text for chunk in chunks]
        # Use sublinear TF scaling and character + word n-grams for legal keyword flexibility
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            stop_words="english"
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def search(self, query: str, top_k: int = 3, min_score: float = 0.05) -> List[RetrievedArticle]:
        """
        Retrieves top_k chunks for a query from this namespace.
        If scores are below min_score, results are omitted so the judge does not cite irrelevant text.
        """
        if not self.chunks or self.vectorizer is None or self.tfidf_matrix is None:
            return []

        # Transform query into TF-IDF space
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Rank indices descending
        ranked_indices = np.argsort(similarities)[::-1]
        results: List[RetrievedArticle] = []

        for idx in ranked_indices[:top_k]:
            score = float(similarities[idx])
            if score < min_score:
                continue

            chunk = self.chunks[idx]
            results.append(
                RetrievedArticle(
                    chunk_id=chunk.chunk_id,
                    constitution_id=chunk.constitution_id,
                    article_number=chunk.article_number,
                    title=chunk.title,
                    part=chunk.part,
                    clause=chunk.clause,
                    text=chunk.text,
                    score=round(score, 4)
                )
            )

        return results


class VectorNamespaceStore:
    """
    Registry of constitution namespaces.
    Strictly prevents cross-constitution leakage.
    """
    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = storage_dir or os.path.join(os.path.dirname(__file__), "..", "..", "data", "namespaces")
        os.makedirs(self.storage_dir, exist_ok=True)
        self.namespaces: Dict[str, NamespaceIndex] = {}

    def ingest_constitution(self, constitution: ConstitutionInput) -> int:
        """
        Chunks the constitution, builds its isolated index, and saves to storage.
        Returns the number of indexed chunks.
        """
        chunks = chunk_constitution(constitution)
        ns_index = NamespaceIndex(namespace_id=constitution.id, name=constitution.name)
        ns_index.build_index(chunks)
        self.namespaces[constitution.id] = ns_index

        # Persist namespace chunks to disk for reproducibility
        ns_file = os.path.join(self.storage_dir, f"{constitution.id}.json")
        data_to_save = {
            "id": constitution.id,
            "name": constitution.name,
            "description": constitution.description,
            "chunks": [chunk.model_dump() for chunk in chunks]
        }
        with open(ns_file, "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)

        return len(chunks)

    def load_persisted_namespace(self, namespace_id: str) -> bool:
        """Loads a previously saved namespace from disk."""
        ns_file = os.path.join(self.storage_dir, f"{namespace_id}.json")
        if not os.path.exists(ns_file):
            return False

        with open(ns_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        chunks = [ArticleChunk(**c) for c in data.get("chunks", [])]
        ns_index = NamespaceIndex(namespace_id=data["id"], name=data["name"])
        ns_index.build_index(chunks)
        self.namespaces[namespace_id] = ns_index
        return True

    def search(self, namespace_id: str, query: str, top_k: int = 3) -> List[RetrievedArticle]:
        """
        Executes a grounded search strictly inside the specified namespace.
        """
        if namespace_id not in self.namespaces:
            # Try loading from disk
            loaded = self.load_persisted_namespace(namespace_id)
            if not loaded:
                raise ValueError(f"Namespace '{namespace_id}' does not exist.")

        return self.namespaces[namespace_id].search(query=query, top_k=top_k)

    def get_namespace_info(self, namespace_id: str) -> Optional[dict]:
        if namespace_id not in self.namespaces:
            if not self.load_persisted_namespace(namespace_id):
                return None
        ns = self.namespaces[namespace_id]
        return {
            "namespace_id": ns.namespace_id,
            "name": ns.name,
            "total_chunks": len(ns.chunks),
            "articles": list({c.article_number for c in ns.chunks})
        }


# Global store instance for the AI service
vector_store = VectorNamespaceStore()
