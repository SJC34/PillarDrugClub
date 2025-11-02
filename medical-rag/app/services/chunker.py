import tiktoken
import hashlib
from typing import List, Tuple
from app.settings import settings


class DocumentChunker:
    """Chunks documents into token-sized pieces with overlap"""
    
    def __init__(self):
        self.encoding = tiktoken.get_encoding("cl100k_base")
        self.min_tokens = settings.chunk_min_tokens
        self.max_tokens = settings.chunk_max_tokens
        self.overlap_tokens = settings.chunk_overlap_tokens
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def chunk_text(self, text: str, metadata: dict) -> List[dict]:
        """
        Split text into overlapping chunks of appropriate token size.
        Returns list of {text, tokens, chunk_index, sha256, metadata}
        """
        # Tokenize the entire text
        tokens = self.encoding.encode(text)
        chunks = []
        chunk_index = 0
        
        start = 0
        while start < len(tokens):
            # Determine end position
            end = min(start + self.max_tokens, len(tokens))
            
            # Extract chunk tokens and decode
            chunk_tokens = tokens[start:end]
            chunk_text = self.encoding.decode(chunk_tokens)
            
            # Only keep chunks that meet minimum size
            if len(chunk_tokens) >= self.min_tokens or end == len(tokens):
                chunk_hash = hashlib.sha256(chunk_text.encode()).hexdigest()
                
                chunks.append({
                    "text": chunk_text.strip(),
                    "tokens": len(chunk_tokens),
                    "chunk_index": chunk_index,
                    "sha256": chunk_hash,
                    **metadata
                })
                chunk_index += 1
            
            # Move start position with overlap
            start = end - self.overlap_tokens if end < len(tokens) else len(tokens)
        
        return chunks
    
    def chunk_by_sections(
        self, 
        sections: List[Tuple[str, str]], 
        base_metadata: dict
    ) -> List[dict]:
        """
        Chunk FDA label sections separately to preserve context.
        sections: List of (section_name, section_text) tuples
        """
        all_chunks = []
        
        for section_name, section_text in sections:
            if not section_text.strip():
                continue
            
            # Add section to metadata
            section_metadata = {
                **base_metadata,
                "section": section_name
            }
            
            # Chunk this section
            section_chunks = self.chunk_text(section_text, section_metadata)
            all_chunks.extend(section_chunks)
        
        return all_chunks
