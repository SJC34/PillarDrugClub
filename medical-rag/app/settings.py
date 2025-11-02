from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    
    # OpenAI
    openai_api_key: str
    
    # LLM Configuration
    llm_provider: str = "openai"
    embeddings_provider: str = "openai"
    
    # Whitelisted Domains
    whitelist_domains: str = "dailymed.nlm.nih.gov,fda.gov,cdc.gov,nih.gov,uspreventiveservicestaskforce.org,ahrq.gov,idsociety.org,acog.org,diabetes.org"
    
    # Chunking
    chunk_min_tokens: int = 400
    chunk_max_tokens: int = 900
    chunk_overlap_tokens: int = 100
    
    # Retrieval
    min_retrieved_chunks: int = 3
    freshness_years: int = 5
    default_k_neighbors: int = 10
    
    # Generation
    min_citations: int = 5
    max_generation_time_seconds: int = 300
    
    # Database
    database_path: str = "./data/medical_blog.db"
    
    # Vector Store
    vector_store_type: str = "faiss"
    vector_store_path: str = "./data/vectors"
    
    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    
    @property
    def whitelist_domains_list(self) -> List[str]:
        return [d.strip() for d in self.whitelist_domains.split(",")]


settings = Settings()
