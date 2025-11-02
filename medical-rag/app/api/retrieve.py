from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select, or_
from datetime import datetime, timedelta
from typing import List
from app.models import RetrieveRequest, RetrieveResponse, ChunkMetadata, DocumentChunk
from app.services.vectors import VectorStore
from app.settings import settings


router = APIRouter(prefix="/retrieve", tags=["retrieval"])


@router.post("", response_model=RetrieveResponse)
async def retrieve_chunks(request: RetrieveRequest, db: Session, vector_store: VectorStore):
    """
    Retrieve relevant document chunks using vector similarity search.
    Filters by freshness and required sections.
    """
    
    # Vector search for similar chunks
    results = vector_store.search(request.query, k=request.k)
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No relevant chunks found in knowledge base"
        )
    
    # Get chunk IDs
    chunk_ids = [chunk_id for chunk_id, _ in results]
    
    # Fetch chunk details from database
    chunks_query = select(DocumentChunk).where(DocumentChunk.id.in_(chunk_ids))
    
    # Apply freshness filter
    if request.max_age_years:
        cutoff_date = datetime.utcnow() - timedelta(days=365 * request.max_age_years)
        chunks_query = chunks_query.where(
            or_(
                DocumentChunk.published_date >= cutoff_date,
                DocumentChunk.published_date == None  # Include undated documents
            )
        )
    
    # Apply section filter
    if request.required_sections:
        chunks_query = chunks_query.where(
            DocumentChunk.section.in_(request.required_sections)
        )
    
    chunks = db.exec(chunks_query).all()
    
    # Check minimum chunks requirement
    if len(chunks) < request.min_chunks:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient evidence: found {len(chunks)} chunks, minimum {request.min_chunks} required"
        )
    
    # Sort chunks by vector similarity (preserve search order)
    chunk_map = {chunk.id: chunk for chunk in chunks}
    sorted_chunks = [chunk_map[chunk_id] for chunk_id, _ in results if chunk_id in chunk_map]
    
    # Convert to response format
    chunk_metadata = []
    for chunk in sorted_chunks:
        metadata = ChunkMetadata(
            title=chunk.title,
            url=chunk.url,
            domain=chunk.domain,
            section=chunk.section,
            published_date=chunk.published_date.isoformat() if chunk.published_date else None,
            excerpt=chunk.text[:300] + "..." if len(chunk.text) > 300 else chunk.text
        )
        chunk_metadata.append(metadata)
    
    return RetrieveResponse(
        chunks=chunk_metadata,
        total_retrieved=len(chunk_metadata)
    )
