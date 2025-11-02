from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlmodel import Session, select
from datetime import datetime
import uuid
import json
from openai import OpenAI
from app.models import (
    GenerateRequest, GenerateResponse, JobStatusResponse,
    MedicalBlogPost, DocumentChunk, PublishRequest, ReviewChecklistRequest
)
from app.services.vectors import VectorStore
from app.services.citations import CitationManager
from app.services.compliance import ComplianceChecker
from app.settings import settings


router = APIRouter(prefix="/generate", tags=["generation"])
client = OpenAI(api_key=settings.openai_api_key)


def get_session():
    from app.main import engine
    with Session(engine) as session:
        yield session


FDA_SYSTEM_PROMPT = """You are a US medical writer constrained to FDA-approved labeling and US clinical guidelines only.
Cite every factual claim with numbered markers like [1], [2] and list full sources (title, org, date, URL).
No off-label claims. No dosing beyond label/guideline. US spelling/terms only.
Sections (in order):
- H1 Title
- Summary (3–4 sentences)
- Indications (label-based)
- Safety (Boxed Warning, Contraindications, Warnings/Precautions)
- Side Effects (common per label)
- Interactions (major classes/notable)
- Who Should Not Use (contraindications)
- FAQs (3–5; each answer must cite)
- Sources (numbered with titles + URLs)
Add footer: "Last reviewed: YYYY-MM-DD. Reviewer: PharmD." and "Educational only; not medical advice." """


async def generate_blog_post_task(job_id: str, topic: str, min_citations: int, db: Session):
    """Background task to generate medical blog post"""
    
    try:
        # Update status to generating
        post = db.exec(select(MedicalBlogPost).where(MedicalBlogPost.job_id == job_id)).first()
        if not post:
            return
        
        post.status = "generating"
        db.add(post)
        db.commit()
        
        # Initialize vector store
        vector_store = VectorStore()
        
        # Retrieve relevant chunks
        results = vector_store.search(topic, k=10)
        if not results or len(results) < settings.min_retrieved_chunks:
            post.status = "failed"
            post.error_message = f"Insufficient evidence: found {len(results)} chunks, need {settings.min_retrieved_chunks}"
            db.add(post)
            db.commit()
            return
        
        # Fetch chunk details
        chunk_ids = [chunk_id for chunk_id, _ in results]
        chunks = db.exec(select(DocumentChunk).where(DocumentChunk.id.in_(chunk_ids))).all()
        
        # Build context for prompt
        context_chunks = []
        for chunk in chunks:
            context_chunks.append({
                "title": chunk.title,
                "domain": chunk.domain,
                "section": chunk.section,
                "published_date": chunk.published_date.isoformat() if chunk.published_date else "Unknown",
                "url": chunk.url,
                "excerpt": chunk.text[:500]
            })
        
        context_block = CitationManager.format_citations(context_chunks)
        
        # Generate content with OpenAI
        prompt = f"""Topic: {topic}

Context from FDA labels and US clinical guidelines:

{context_block}

Generate a comprehensive, patient-friendly medical blog post on this topic using ONLY the context provided above. Follow all requirements in the system prompt."""
        
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": FDA_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        html_content = completion.choices[0].message.content
        
        # Extract citations from generated content
        citations = CitationManager.extract_citations_from_html(html_content)
        
        # Run compliance checks
        policy_report = ComplianceChecker.check_policy(
            html_content,
            citations,
            context_chunks,
            min_citations
        )
        
        # Generate schema.org markup
        schema_jsonld = generate_schema_markup(topic, html_content, citations)
        
        # Update post with results
        post.status = "completed" if policy_report.passed else "failed"
        post.content_html = html_content
        post.citations = json.dumps(citations)
        post.policy_report = policy_report.model_dump_json()
        post.schema_jsonld = json.dumps(schema_jsonld)
        post.completed_at = datetime.utcnow()
        
        if not policy_report.passed:
            post.error_message = f"Policy violations: {', '.join(policy_report.failures)}"
        
        db.add(post)
        db.commit()
        
    except Exception as e:
        # Handle generation errors
        post = db.exec(select(MedicalBlogPost).where(MedicalBlogPost.job_id == job_id)).first()
        if post:
            post.status = "failed"
            post.error_message = str(e)
            post.completed_at = datetime.utcnow()
            db.add(post)
            db.commit()


def generate_schema_markup(topic: str, html_content: str, citations: List[dict]) -> dict:
    """Generate schema.org JSON-LD for medical content"""
    today = datetime.utcnow().isoformat()
    
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "MedicalWebPage",
                "headline": topic,
                "datePublished": today,
                "dateModified": today,
                "author": {
                    "@type": "Organization",
                    "name": "Pillar Drug Club"
                },
                "reviewedBy": {
                    "@type": "Person",
                    "jobTitle": "PharmD"
                },
                "citation": [{"@type": "CreativeWork", "url": c["url"]} for c in citations if c.get("url")]
            }
        ]
    }
    
    # Add FAQPage if FAQs present
    if "FAQ" in html_content.upper():
        schema["@graph"].append({
            "@type": "FAQPage",
            "mainEntity": []  # Would need to parse FAQ questions/answers
        })
    
    return schema


@router.post("", response_model=GenerateResponse)
async def generate_post(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session)
):
    """Start medical blog post generation job"""
    
    # Create job record
    job_id = str(uuid.uuid4())
    post = MedicalBlogPost(
        job_id=job_id,
        topic=request.topic,
        status="pending"
    )
    db.add(post)
    db.commit()
    
    # Start background generation
    background_tasks.add_task(
        generate_blog_post_task,
        job_id=job_id,
        topic=request.topic,
        min_citations=request.min_citations,
        db=db
    )
    
    return GenerateResponse(job_id=job_id, status="pending")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, db: Session = Depends(get_session)):
    """Get status and result of generation job"""
    
    post = db.exec(select(MedicalBlogPost).where(MedicalBlogPost.job_id == job_id)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        job_id=post.job_id,
        status=post.status,
        content_html=post.content_html,
        citations=json.loads(post.citations) if post.citations else None,
        policy_report=json.loads(post.policy_report) if post.policy_report else None,
        schema_jsonld=json.loads(post.schema_jsonld) if post.schema_jsonld else None,
        error_message=post.error_message,
        created_at=post.created_at.isoformat(),
        completed_at=post.completed_at.isoformat() if post.completed_at else None
    )


@router.post("/review", status_code=200)
async def review_post(request: ReviewChecklistRequest, db: Session = Depends(get_session)):
    """Admin review checklist approval"""
    
    post = db.exec(select(MedicalBlogPost).where(MedicalBlogPost.id == request.post_id)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Verify all checkboxes are true
    if not all([
        request.boxed_warning_included,
        request.contraindications_included,
        request.us_sources_only,
        request.no_off_label
    ]):
        raise HTTPException(
            status_code=400,
            detail="All compliance checkboxes must be checked before approval"
        )
    
    post.reviewer_approved = True
    db.add(post)
    db.commit()
    
    return {"message": "Post approved by reviewer"}


@router.post("/publish", status_code=200)
async def publish_post(request: PublishRequest, db: Session = Depends(get_session)):
    """Publish approved post to static HTML"""
    
    post = db.exec(select(MedicalBlogPost).where(MedicalBlogPost.id == request.post_id)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if not post.reviewer_approved:
        raise HTTPException(status_code=403, detail="Post must be reviewed and approved before publishing")
    
    # Update publish status
    post.published = True
    post.published_path = request.path
    db.add(post)
    db.commit()
    
    # TODO: Write HTML file to public directory
    # For now, just mark as published in database
    
    return {"message": f"Post published to {request.path}"}
