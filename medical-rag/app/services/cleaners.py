import re
from urllib.parse import urlparse
from app.settings import settings


class SourceCleaner:
    """Validates and cleans medical source documents"""
    
    @staticmethod
    def is_whitelisted_domain(url: str) -> bool:
        """Check if URL is from approved medical source"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove www. prefix if present
            if domain.startswith("www."):
                domain = domain[4:]
            
            whitelist = settings.whitelist_domains_list
            return any(domain == allowed or domain.endswith(f".{allowed}") 
                      for allowed in whitelist)
        except Exception:
            return False
    
    @staticmethod
    def extract_domain(url: str) -> str:
        """Extract clean domain from URL"""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove control characters
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace("'", "'").replace("'", "'")
        
        return text.strip()
    
    @staticmethod
    def extract_title(html_content: str, default: str = "Untitled Document") -> str:
        """Extract document title from HTML"""
        # Try to find title tag
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', html_content, re.IGNORECASE)
        if title_match:
            return SourceCleaner.clean_text(title_match.group(1))
        
        # Try to find h1
        h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html_content, re.IGNORECASE)
        if h1_match:
            return SourceCleaner.clean_text(h1_match.group(1))
        
        return default
