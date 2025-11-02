from typing import List, Dict
import re


class CitationManager:
    """Manages citations and reference formatting"""
    
    @staticmethod
    def extract_citations_from_html(html_content: str) -> List[Dict]:
        """
        Extract citation information from HTML content.
        Looks for numbered citations [1], [2], etc. and their corresponding sources.
        """
        citations = []
        
        # Find the Sources section
        sources_match = re.search(
            r'<h2[^>]*>Sources</h2>(.*?)(?:<h[12]|$)',
            html_content,
            re.DOTALL | re.IGNORECASE
        )
        
        if not sources_match:
            return citations
        
        sources_section = sources_match.group(1)
        
        # Extract individual citations
        # Format: [1] Title. Organization. Date. URL
        citation_pattern = r'\[(\d+)\]\s*([^\n]+?)\.?\s*(https?://[^\s<]+)'
        matches = re.findall(citation_pattern, sources_section)
        
        for number, title, url in matches:
            # Parse title and organization
            parts = title.split('.')
            citation_title = parts[0].strip() if parts else title
            organization = parts[1].strip() if len(parts) > 1 else "FDA"
            
            citations.append({
                "number": int(number),
                "title": citation_title,
                "organization": organization,
                "url": url.strip(),
                "date": CitationManager._extract_year_from_text(title)
            })
        
        return citations
    
    @staticmethod
    def _extract_year_from_text(text: str) -> str:
        """Extract year from text if present"""
        year_match = re.search(r'(20\d{2})', text)
        return year_match.group(1) if year_match else ""
    
    @staticmethod
    def format_citations(chunks: List[Dict]) -> str:
        """Format retrieved chunks into citation list for prompt"""
        citations = []
        for idx, chunk in enumerate(chunks, 1):
            citation = f"[{idx}] {chunk.get('title', 'Untitled')}"
            if chunk.get('domain'):
                citation += f" ({chunk['domain']})"
            if chunk.get('section'):
                citation += f" - {chunk['section']}"
            if chunk.get('published_date'):
                citation += f" ({chunk['published_date']})"
            if chunk.get('url'):
                citation += f"\nURL: {chunk['url']}"
            if chunk.get('excerpt'):
                citation += f"\nExcerpt: {chunk['excerpt'][:300]}..."
            
            citations.append(citation)
        
        return "\n\n".join(citations)
    
    @staticmethod
    def validate_citation_markers(html_content: str, citations: List[Dict]) -> bool:
        """Verify that all citation numbers in text have corresponding sources"""
        # Find all citation markers in content
        markers = set(re.findall(r'\[(\d+)\]', html_content))
        
        # Get citation numbers from sources
        citation_numbers = {str(c['number']) for c in citations}
        
        # Check if all markers have sources
        missing = markers - citation_numbers
        return len(missing) == 0
