from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import create_engine, SQLModel, Session
from contextlib import asynccontextmanager
import os

from app.settings import settings
from app.models import DocumentChunk, MedicalBlogPost
from app.services.vectors import VectorStore
from app.api import ingest, retrieve, generate


# Database setup
engine = create_engine(
    f"sqlite:///{settings.database_path}",
    connect_args={"check_same_thread": False}
)


def create_db_and_tables():
    """Initialize database tables"""
    os.makedirs(os.path.dirname(settings.database_path), exist_ok=True)
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session


# Global vector store instance
_vector_store = None


def get_vector_store():
    """Dependency to get vector store"""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Initializing Medical RAG Service...")
    create_db_and_tables()
    print("✅ Database initialized")
    
    # Initialize vector store
    global _vector_store
    _vector_store = VectorStore()
    print(f"✅ Vector store ready ({_vector_store.index.ntotal} vectors loaded)")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Medical RAG Service")


# Create FastAPI app
app = FastAPI(
    title="Medical RAG Service",
    description="FDA-compliant medical blog generation with RAG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for integration with main app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers  
# Dependencies are now injected at route level using Depends()
app.include_router(ingest.router, prefix="/api")
app.include_router(retrieve.router, prefix="/api")
app.include_router(generate.router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Medical RAG",
        "status": "running",
        "version": "1.0.0",
        "whitelist_domains": settings.whitelist_domains_list,
        "vector_store_size": _vector_store.index.ntotal if _vector_store else 0
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    db_healthy = os.path.exists(settings.database_path)
    vector_store_healthy = _vector_store is not None and _vector_store.index.ntotal >= 0
    
    return {
        "healthy": db_healthy and vector_store_healthy,
        "database": "connected" if db_healthy else "error",
        "vector_store": "ready" if vector_store_healthy else "error",
        "chunks_indexed": _vector_store.index.ntotal if _vector_store else 0
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
