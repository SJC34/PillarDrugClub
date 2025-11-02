from bs4 import BeautifulSoup
from typing import List, Tuple, Optional
from datetime import datetime
import re


class FDALabelParser:
    """Parses FDA Structured Product Labels (SPL) from DailyMed"""
    
    # FDA SPL section names and their variations
    SECTION_MAPPINGS = {
        "indications": ["INDICATIONS AND USAGE", "INDICATIONS", "CLINICAL PHARMACOLOGY - INDICATIONS"],
        "dosage": ["DOSAGE AND ADMINISTRATION", "DOSAGE", "DOSE AND ADMINISTRATION"],
        "boxed_warning": ["BOXED WARNING", "WARNINGS - BOXED WARNING", "BLACK BOX WARNING"],
        "contraindications": ["CONTRAINDICATIONS"],
        "warnings": ["WARNINGS AND PRECAUTIONS", "WARNINGS", "PRECAUTIONS"],
        "adverse_reactions": ["ADVERSE REACTIONS", "ADVERSE EVENTS", "SIDE EFFECTS"],
        "drug_interactions": ["DRUG INTERACTIONS", "INTERACTIONS"],
        "use_in_populations": ["USE IN SPECIFIC POPULATIONS", "PREGNANCY", "NURSING MOTHERS", 
                              "PEDIATRIC USE", "GERIATRIC USE"]
    }
    
    @staticmethod
    def parse_dailymed_label(html_content: str) -> dict:
        """
        Parse DailyMed FDA label HTML into structured sections.
        Returns dict with title, sections, published_date
        """
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Extract title
        title = FDALabelParser._extract_title(soup)
        
        # Extract published date
        published_date = FDALabelParser._extract_date(soup)
        
        # Extract all sections
        sections = FDALabelParser._extract_sections(soup)
        
        return {
            "title": title,
            "published_date": published_date,
            "sections": sections
        }
    
    @staticmethod
    def _extract_title(soup: BeautifulSoup) -> str:
        """Extract drug name and title"""
        # Try meta tags first
        meta_title = soup.find("meta", {"name": "dc.title"})
        if meta_title and meta_title.get("content"):
            return meta_title["content"].strip()
        
        # Try h1 or title tag
        title_tag = soup.find("h1") or soup.find("title")
        if title_tag:
            return title_tag.get_text().strip()
        
        return "Untitled FDA Label"
    
    @staticmethod
    def _extract_date(soup: BeautifulSoup) -> Optional[datetime]:
        """Extract document publication date"""
        # Look for meta date tags
        date_tag = soup.find("meta", {"name": "dc.date"})
        if date_tag and date_tag.get("content"):
            try:
                return datetime.fromisoformat(date_tag["content"].split("T")[0])
            except:
                pass
        
        # Look for date in text
        date_pattern = r'(\d{1,2})/(\d{1,2})/(\d{4})'
        date_text = soup.get_text()
        date_match = re.search(date_pattern, date_text[:1000])  # Search first 1000 chars
        if date_match:
            try:
                month, day, year = date_match.groups()
                return datetime(int(year), int(month), int(day))
            except:
                pass
        
        return None
    
    @staticmethod
    def _extract_sections(soup: BeautifulSoup) -> List[Tuple[str, str]]:
        """Extract FDA label sections with normalized names"""
        sections = []
        
        # Find all section headers (typically h2 or h3 with specific IDs/classes)
        headers = soup.find_all(['h2', 'h3', 'h4'])
        
        for header in headers:
            header_text = header.get_text().strip().upper()
            
            # Match to known FDA sections
            section_name = FDALabelParser._normalize_section_name(header_text)
            if not section_name:
                continue
            
            # Extract content until next header
            content = FDALabelParser._extract_section_content(header)
            if content:
                sections.append((section_name, content))
        
        return sections
    
    @staticmethod
    def _normalize_section_name(header_text: str) -> Optional[str]:
        """Map header text to standardized section name"""
        for section_key, variations in FDALabelParser.SECTION_MAPPINGS.items():
            for variation in variations:
                if variation in header_text:
                    return section_key
        return None
    
    @staticmethod
    def _extract_section_content(header) -> str:
        """Extract all content between this header and the next"""
        content_parts = []
        current = header.find_next_sibling()
        
        while current:
            # Stop at next header
            if current.name in ['h1', 'h2', 'h3', 'h4', 'h5']:
                break
            
            # Get text content
            if current.name in ['p', 'div', 'ul', 'ol', 'table']:
                text = current.get_text(separator=' ', strip=True)
                if text:
                    content_parts.append(text)
            
            current = current.find_next_sibling()
        
        return '\n\n'.join(content_parts)
