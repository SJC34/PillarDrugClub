from fastapi import APIRouter, HTTPException, UploadFile, File
from sqlmodel import Session, select
import httpx
from datetime import datetime
from app.models import IngestURLRequest, IngestURLResponse, DocumentChunk
from app.services.cleaners import SourceCleaner
from app.services.fda_parser import FDALabelParser
from app.services.chunker import DocumentChunker
from app.services.vectors import VectorStore
from app.settings import settings


router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/url", response_model=IngestURLResponse)
async def ingest_url(request: IngestURLRequest, db: Session, vector_store: VectorStore):
    """Ingest document from whitelisted URL"""
    
    # Validate whitelist
    if not SourceCleaner.is_whitelisted_domain(request.url):
        raise HTTPException(
            status_code=403,
            detail=f"Domain not whitelisted. Allowed: {settings.whitelist_domains_list}"
        )
    
    try:
        # Fetch content
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(request.url)
            response.raise_for_status()
            html_content = response.text
        
        # Parse based on domain
        domain = SourceCleaner.extract_domain(request.url)
        
        if "dailymed.nlm.nih.gov" in domain:
            # Parse FDA label
            parsed = FDALabelParser.parse_dailymed_label(html_content)
            title = parsed["title"]
            published_date = parsed["published_date"]
            sections = parsed["sections"]
        else:
            # Generic HTML parsing
            title = SourceCleaner.extract_title(html_content)
            published_date = None
            # Extract text and treat as single section
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'lxml')
            text = SourceCleaner.clean_text(soup.get_text())
            sections = [("general", text)]
        
        # Chunk the document
        chunker = DocumentChunker()
        base_metadata = {
            "title": title,
            "url": request.url,
            "domain": domain,
            "published_date": published_date
        }
        
        chunks = chunker.chunk_by_sections(sections, base_metadata)
        
        # Save chunks to database
        chunk_ids = []
        chunk_texts = []
        chunks_created = 0
        
        for chunk_data in chunks:
            # Check if chunk already exists (by SHA256)
            existing = db.exec(
                select(DocumentChunk).where(DocumentChunk.sha256 == chunk_data["sha256"])
            ).first()
            
            if not existing:
                # Create new chunk
                chunk = DocumentChunk(
                    title=chunk_data["title"],
                    url=chunk_data["url"],
                    domain=chunk_data["domain"],
                    section=chunk_data.get("section"),
                    published_date=chunk_data.get("published_date"),
                    text=chunk_data["text"],
                    tokens=chunk_data["tokens"],
                    sha256=chunk_data["sha256"],
                    chunk_index=chunk_data["chunk_index"]
                )
                db.add(chunk)
                db.commit()
                db.refresh(chunk)
                
                chunk_ids.append(chunk.id)
                chunk_texts.append(chunk.text)
                chunks_created += 1
        
        # Add to vector store
        if chunk_ids:
            vector_store.add_chunks(chunk_ids, chunk_texts)
        
        return IngestURLResponse(
            success=True,
            chunks_created=chunks_created,
            message=f"Successfully ingested {chunks_created} chunks from {title}"
        )
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/upload", response_model=IngestURLResponse)
async def ingest_upload(
    file: UploadFile = File(...),
    db: Session = None,
    vector_store: VectorStore = None
):
    """Upload and ingest PDF or HTML file"""
    
    if file.content_type not in ["text/html", "application/pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Only HTML and PDF files are supported"
        )
    
    # TODO: Implement PDF parsing with PyPDF2 or similar
    # For now, only support HTML
    if file.content_type != "text/html":
        raise HTTPException(
            status_code=501,
            detail="PDF upload not yet implemented"
        )
    
    content = await file.read()
    html_content = content.decode('utf-8')
    
    # Parse and ingest similar to URL ingestion
    # (Implementation similar to ingest_url but without URL fetch)
    
    return IngestURLResponse(
        success=True,
        chunks_created=0,
        message="Upload feature coming soon"
    )
