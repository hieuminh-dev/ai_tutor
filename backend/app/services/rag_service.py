import os
import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class RAGService:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.chunks: List[str] = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        self._initialize_knowledge_base()

    def _initialize_knowledge_base(self):
        """Scans the study_materials folder, reads files, chunks them, and builds TF-IDF index."""
        # Look in multiple possible folders
        directories = [
            os.path.join("app", "study_materials"),
            os.path.join("backend", "app", "study_materials"),
            os.path.join("d:\\FLL\\RAJA\\backend\\app\\study_materials"),
            "study_materials"
        ]
        
        study_dir = None
        for d in directories:
            if os.path.exists(d):
                study_dir = d
                break
                
        if not study_dir:
            print("WARNING: study_materials directory not found. RAG service initialized empty.")
            return

        all_text_files = [
            os.path.join(study_dir, f) for f in os.listdir(study_dir)
            if f.endswith(".txt")
        ]
        
        raw_documents = []
        for file_path in all_text_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    raw_documents.append(content)
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")

        # Chunk documents
        for doc in raw_documents:
            self.chunks.extend(self._split_text(doc))

        if self.chunks:
            # Build index
            self.tfidf_matrix = self.vectorizer.fit_transform(self.chunks)
            print(f"RAG Service initialized successfully with {len(self.chunks)} chunks.")
        else:
            print("WARNING: RAG Service initialized with 0 chunks.")

    def _split_text(self, text: str) -> List[str]:
        """Splits a document text into overlapping chunks of chunk_size characters."""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + self.chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += self.chunk_size - self.chunk_overlap
            
            # Prevent infinite loops in edge case of small/zero overlap
            if self.chunk_size - self.chunk_overlap <= 0:
                break
                
        return chunks

    def retrieve(self, query: str, top_n: int = 3) -> List[str]:
        """Retrieves top_n most relevant chunks matching the query using TF-IDF cosine similarity."""
        if not self.chunks or self.tfidf_matrix is None:
            return []

        try:
            query_vector = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Get top N indices sorted by similarity descending
            top_indices = similarities.argsort()[::-1][:top_n]
            
            retrieved = []
            for idx in top_indices:
                # Only return if similarity score is above 0 to avoid irrelevant default matches
                if similarities[idx] > 0.05:
                    retrieved.append(self.chunks[idx].strip())
            return retrieved
        except Exception as e:
            print(f"Error during RAG retrieval: {e}")
            return []


# Singleton instance of RAGService
rag_service = RAGService()
