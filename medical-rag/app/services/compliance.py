import re
from typing import List, Dict
from app.models import PolicyReport


class ComplianceChecker:
    """FDA compliance guardrails for generated medical content"""
    
    REQUIRED_SAFETY_SECTIONS = [
        "boxed warning", "contraindications", "warnings and precautions",
        "adverse reactions", "drug interactions"
    ]
    
    REQUIRED_DISCLAIMER = "Educational only; not medical advice"
    
    US_ONLY_DOMAINS = [
        "dailymed.nlm.nih.gov", "fda.gov", "cdc.gov", "nih.gov",
        "uspreventiveservicestaskforce.org", "ahrq.gov", "idsociety.org",
        "acog.org", "diabetes.org"
    ]
    
    @staticmethod
    def check_policy(
        html_content: str,
        citations: List[Dict],
        retrieved_chunks: List[Dict],
        min_citations: int = 5
    ) -> PolicyReport:
        """
        Run all compliance checks on generated content.
        Returns PolicyReport with pass/fail status.
        """
        failures = []
        warnings = []
        rules_checked = []
        
        # 1. Citation Density Check
        word_count = len(html_content.split())
        citation_count = len(citations)
        citation_density = citation_count / max(word_count, 1) * 150  # per 150 words
        
        rules_checked.append("Citation Density")
        if citation_density < 1.0:
            failures.append(f"Insufficient citation density: {citation_density:.2f} citations per 150 words (minimum: 1.0)")
        
        # 2. Minimum Citations Check
        rules_checked.append("Minimum Citations")
        if citation_count < min_citations:
            failures.append(f"Insufficient citations: {citation_count} (minimum: {min_citations})")
        
        # 3. US Sources Only Check
        us_sources_only = True
        rules_checked.append("US Sources Only")
        for citation in citations:
            url = citation.get("url", "")
            if not ComplianceChecker._is_us_source(url):
                failures.append(f"Non-US source detected: {url}")
                us_sources_only = False
        
        # 4. Safety Sections Check
        has_boxed_warning = ComplianceChecker._has_section(html_content, ["boxed warning", "black box"])
        has_contraindications = ComplianceChecker._has_section(html_content, ["contraindications"])
        has_warnings = ComplianceChecker._has_section(html_content, ["warnings", "precautions"])
        has_adverse = ComplianceChecker._has_section(html_content, ["adverse reactions", "side effects"])
        has_interactions = ComplianceChecker._has_section(html_content, ["drug interactions", "interactions"])
        
        has_safety_sections = has_warnings and has_adverse and has_interactions
        
        rules_checked.append("Safety Sections Present")
        if not has_safety_sections:
            missing = []
            if not has_warnings:
                missing.append("Warnings/Precautions")
            if not has_adverse:
                missing.append("Adverse Reactions")
            if not has_interactions:
                missing.append("Drug Interactions")
            failures.append(f"Missing required safety sections: {', '.join(missing)}")
        
        # Boxed warning and contraindications as warnings, not failures
        if not has_boxed_warning:
            warnings.append("Boxed Warning section not detected (may not apply to all drugs)")
        
        if not has_contraindications:
            warnings.append("Contraindications section not detected")
        
        # 5. Fair Balance Check (if Indications present, require Safety)
        has_indications = ComplianceChecker._has_section(html_content, ["indications", "usage"])
        rules_checked.append("Fair Balance")
        if has_indications and not has_safety_sections:
            failures.append("Fair balance violation: Indications present without complete safety information")
        
        # 6. Disclaimer Check
        has_disclaimer = ComplianceChecker.REQUIRED_DISCLAIMER.lower() in html_content.lower()
        rules_checked.append("Disclaimer Present")
        if not has_disclaimer:
            failures.append(f"Required disclaimer missing: '{ComplianceChecker.REQUIRED_DISCLAIMER}'")
        
        # 7. Off-Label Detection
        rules_checked.append("Off-Label Detection")
        off_label_risk = ComplianceChecker._detect_off_label(html_content, retrieved_chunks)
        if off_label_risk:
            warnings.append(f"Potential off-label content detected: {off_label_risk}")
        
        # 8. FAQ Citations Check
        rules_checked.append("FAQ Citations")
        if "FAQ" in html_content.upper() or "Q:" in html_content:
            faq_has_citations = ComplianceChecker._check_faq_citations(html_content)
            if not faq_has_citations:
                failures.append("FAQ section present but answers lack citations")
        
        return PolicyReport(
            passed=len(failures) == 0,
            rules_checked=rules_checked,
            failures=failures,
            warnings=warnings,
            citation_count=citation_count,
            citation_density=citation_density,
            has_boxed_warning=has_boxed_warning,
            has_contraindications=has_contraindications,
            has_safety_sections=has_safety_sections,
            has_disclaimer=has_disclaimer,
            us_sources_only=us_sources_only
        )
    
    @staticmethod
    def _is_us_source(url: str) -> bool:
        """Check if URL is from approved US source"""
        return any(domain in url.lower() for domain in ComplianceChecker.US_ONLY_DOMAINS)
    
    @staticmethod
    def _has_section(html_content: str, keywords: List[str]) -> bool:
        """Check if content has section with given keywords"""
        html_lower = html_content.lower()
        return any(keyword.lower() in html_lower for keyword in keywords)
    
    @staticmethod
    def _detect_off_label(html_content: str, retrieved_chunks: List[Dict]) -> str:
        """
        Detect potential off-label claims by checking if indications
        in content match those in retrieved FDA labels.
        Returns warning message if detected, empty string otherwise.
        """
        # Extract indications from retrieved chunks
        approved_indications = []
        for chunk in retrieved_chunks:
            if chunk.get("section") == "indications":
                approved_indications.append(chunk.get("text", "").lower())
        
        if not approved_indications:
            return "No FDA indications found in retrieved sources"
        
        # Look for indication claims in content
        indication_pattern = r'(?:indicated for|used to treat|treatment of|approved for)\s+([^.]+)'
        matches = re.findall(indication_pattern, html_content.lower())
        
        # Check if any claimed indications are not in approved list
        for claimed_indication in matches:
            found = any(claimed_indication[:30] in approved for approved in approved_indications)
            if not found:
                return f"Potential off-label indication: '{claimed_indication[:50]}...'"
        
        return ""
    
    @staticmethod
    def _check_faq_citations(html_content: str) -> bool:
        """Check if FAQ answers have citations"""
        # Look for FAQ answers (text between Q:/A: or in specific sections)
        faq_section = re.search(r'(?:FAQ|Frequently Asked)(.*?)(?:<h[12]|$)', html_content, re.DOTALL | re.IGNORECASE)
        if faq_section:
            faq_text = faq_section.group(1)
            # Check if there are citation markers [1], [2], etc.
            has_citations = bool(re.search(r'\[\d+\]', faq_text))
            return has_citations
        return True  # No FAQ section found
