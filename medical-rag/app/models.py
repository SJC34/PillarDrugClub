from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


# Database Models
class DocumentChunk(SQLModel, table=True):
    """Stores document chunks with metadata for RAG retrieval"""
    __tablename__ = "document_chunks"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    url: str
    domain: str = Field(index=True)
    section: Optional[str] = None  # FDA SPL section name
    published_date: Optional[datetime] = None
    text: str
    tokens: int
    sha256: str = Field(unique=True)  # Deduplication
    chunk_index: int  # Position in source document
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MedicalBlogPost(SQLModel, table=True):
    """Stores generated medical blog posts"""
    __tablename__ = "medical_blog_posts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: str = Field(unique=True, index=True)
    topic: str
    status: str = Field(default="pending")  # pending, generating, failed, completed
    content_html: Optional[str] = None
    citations: Optional[str] = None  # JSON array of citation objects
    policy_report: Optional[str] = None  # JSON compliance report
    schema_jsonld: Optional[str] = None  # SEO structured data
    error_message: Optional[str] = None
    reviewer_approved: bool = Field(default=False)
    published: bool = Field(default=False)
    published_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


# API Request/Response Models
class IngestURLRequest(BaseModel):
    url: str


class IngestURLResponse(BaseModel):
    success: bool
    chunks_created: int
    message: str


class RetrieveRequest(BaseModel):
    query: str
    k: int = 10
    min_chunks: int = 3
    max_age_years: int = 5
    required_sections: Optional[List[str]] = None


class ChunkMetadata(BaseModel):
    title: str
    url: str
    domain: str
    section: Optional[str]
    published_date: Optional[str]
    excerpt: str


class RetrieveResponse(BaseModel):
    chunks: List[ChunkMetadata]
    total_retrieved: int


class GenerateRequest(BaseModel):
    topic: str
    min_citations: int = 5


class GenerateResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    content_html: Optional[str] = None
    citations: Optional[List[dict]] = None
    policy_report: Optional[dict] = None
    schema_jsonld: Optional[dict] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


class PolicyReport(BaseModel):
    """Compliance validation report"""
    passed: bool
    rules_checked: List[str]
    failures: List[str]
    warnings: List[str]
    citation_count: int
    citation_density: float
    has_boxed_warning: bool
    has_contraindications: bool
    has_safety_sections: bool
    has_disclaimer: bool
    us_sources_only: bool


class PublishRequest(BaseModel):
    post_id: int
    path: str


class ReviewChecklistRequest(BaseModel):
    post_id: int
    boxed_warning_included: bool
    contraindications_included: bool
    us_sources_only: bool
    no_off_label: bool
