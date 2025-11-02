import os
import numpy as np
import faiss
from typing import List, Tuple
from openai import OpenAI
from app.settings import settings


class VectorStore:
    """FAISS-based vector store for document embeddings"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.dimension = 1536  # text-embedding-3-small dimension
        self.index_path = os.path.join(settings.vector_store_path, "index.faiss")
        self.mappings_path = os.path.join(settings.vector_store_path, "mappings.npy")
        
        # Create vector store directory if needed
        os.makedirs(settings.vector_store_path, exist_ok=True)
        
        # Load or create index
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            self.id_mappings = np.load(self.mappings_path).tolist()
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.id_mappings = []
    
    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [item.embedding for item in response.data]
    
    def add_chunks(self, chunk_ids: List[int], texts: List[str]):
        """Add chunks to vector index"""
        if not texts:
            return
        
        # Generate embeddings
        embeddings = self.embed_batch(texts)
        embeddings_array = np.array(embeddings, dtype=np.float32)
        
        # Add to FAISS index
        self.index.add(embeddings_array)
        
        # Store ID mappings
        self.id_mappings.extend(chunk_ids)
        
        # Save index and mappings
        self.save()
    
    def search(self, query: str, k: int = 10) -> List[Tuple[int, float]]:
        """
        Search for similar chunks.
        Returns list of (chunk_id, distance) tuples
        """
        if self.index.ntotal == 0:
            return []
        
        # Generate query embedding
        query_embedding = self.embed_text(query)
        query_array = np.array([query_embedding], dtype=np.float32)
        
        # Search FAISS index
        k = min(k, self.index.ntotal)  # Don't request more than available
        distances, indices = self.index.search(query_array, k)
        
        # Map indices to chunk IDs
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(self.id_mappings):
                chunk_id = self.id_mappings[idx]
                results.append((chunk_id, float(distance)))
        
        return results
    
    def save(self):
        """Persist index and mappings to disk"""
        faiss.write_index(self.index, self.index_path)
        np.save(self.mappings_path, np.array(self.id_mappings))
    
    def clear(self):
        """Clear all vectors and mappings"""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.id_mappings = []
        self.save()
