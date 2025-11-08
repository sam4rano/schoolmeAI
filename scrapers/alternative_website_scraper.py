"""
Alternative Website Scraper
Uses Google Search API and pattern matching to find institution websites
"""
import logging
import re
import time
import os
import requests
from typing import Dict, List, Optional
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)


class AlternativeWebsiteScraper:
    """Scraper for institution websites using alternative sources"""

    def __init__(self):
        self.rate_limit_delay = 1.0
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        # Google Custom Search API credentials (optional)
        self.google_api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
        self.google_cx = os.getenv("GOOGLE_SEARCH_CX")
    
    def search_google(self, query: str) -> Optional[str]:
        """Search for institution website using Google Custom Search API"""
        if not self.google_api_key or not self.google_cx:
            logger.debug("Google Search API credentials not configured")
            return None
        
        try:
            time.sleep(self.rate_limit_delay)
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": self.google_api_key,
                "cx": self.google_cx,
                "q": query,
                "num": 1,  # Only need the first result
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "items" in data and len(data["items"]) > 0:
                first_result = data["items"][0]
                link = first_result.get("link", "")
                
                # Validate it's a real website
                if self._is_valid_website(link):
                    logger.debug(f"Found website via Google: {link}")
                    return link
            
        except Exception as e:
            logger.debug(f"Google Search API error: {e}")
        
        return None
    
    def search_via_patterns(self, institution_name: str) -> Optional[str]:
        """Search for website using common domain patterns"""
        # Normalize institution name
        normalized = self._normalize_for_domain(institution_name)
        
        # Common patterns for Nigerian institutions
        patterns = [
            # .edu.ng patterns
            f"https://www.{normalized}.edu.ng",
            f"https://{normalized}.edu.ng",
            f"https://www.{normalized}.edu.ng.ng",
            f"https://{normalized}.edu.ng.ng",
            
            # .com patterns
            f"https://www.{normalized}.com",
            f"https://{normalized}.com",
            f"https://www.{normalized}.com.ng",
            f"https://{normalized}.com.ng",
            
            # .org patterns
            f"https://www.{normalized}.org",
            f"https://{normalized}.org",
            f"https://www.{normalized}.org.ng",
            f"https://{normalized}.org.ng",
        ]
        
        # Add abbreviation patterns (e.g., "unilag" for "University of Lagos")
        abbreviated = self._abbreviate_name(institution_name)
        if abbreviated and abbreviated != normalized:
            abbrev_patterns = [
                f"https://www.{abbreviated}.edu.ng",
                f"https://{abbreviated}.edu.ng",
                f"https://www.{abbreviated}.com",
                f"https://{abbreviated}.com",
            ]
            patterns.extend(abbrev_patterns)
        
        # Check each pattern
        for pattern in patterns:
            if self._check_domain_exists(pattern):
                logger.debug(f"Found website via pattern: {pattern}")
                return pattern
        
        return None
    
    def search_via_direct_check(self, institution_name: str) -> Optional[str]:
        """Directly check common domain variations"""
        normalized = self._normalize_for_domain(institution_name)
        
        # Try most common patterns first
        common_patterns = [
            f"www.{normalized}.edu.ng",
            f"{normalized}.edu.ng",
            f"www.{normalized}.com",
            f"{normalized}.com",
        ]
        
        for domain in common_patterns:
            url = f"https://{domain}"
            if self._check_domain_exists(url):
                logger.debug(f"Found website via direct check: {url}")
                return url
        
        return None
    
    def find_website(self, institution_name: str, institution_type: Optional[str] = None) -> Optional[str]:
        """Find website using multiple methods in order of preference"""
        # Build search query
        search_query = f"{institution_name} official website"
        if institution_type:
            search_query += f" {institution_type}"
        
        # Method 1: Google Search API (if available)
        website = self.search_google(search_query)
        if website:
            return website
        
        # Method 2: Pattern matching
        website = self.search_via_patterns(institution_name)
        if website:
            return website
        
        # Method 3: Direct domain check
        website = self.search_via_direct_check(institution_name)
        if website:
            return website
        
        return None
    
    def _normalize_for_domain(self, name: str) -> str:
        """Normalize institution name for domain generation"""
        if not name:
            return ""
        
        # Convert to lowercase
        name = name.lower().strip()
        
        # Remove common prefixes
        name = re.sub(r"^(the|a)\s+", "", name, flags=re.I)
        
        # Remove common suffixes (but keep the core name)
        name = re.sub(r"\s+(university|polytechnic|college|institute|school|of|and|in|nigeria|nigerian)\b", "", name, flags=re.I)
        
        # Remove punctuation and special characters
        name = re.sub(r"[^\w\s]", "", name)
        
        # Replace spaces with nothing (for domain)
        name = name.replace(" ", "")
        
        # Remove extra whitespace
        name = " ".join(name.split())
        name = name.replace(" ", "")
        
        return name.strip()
    
    def _abbreviate_name(self, name: str) -> Optional[str]:
        """Generate abbreviation from institution name"""
        if not name:
            return None
        
        # Common abbreviations
        abbrev_map = {
            "university of lagos": "unilag",
            "university of ibadan": "ui",
            "university of nigeria": "unn",
            "ahmadu bello university": "abu",
            "obafemi awolowo university": "oau",
            "university of benin": "uniben",
            "university of calabar": "unical",
            "university of port harcourt": "uniport",
            "university of maiduguri": "unimaid",
            "bayero university": "buk",
            "nnamdi azikiwe university": "unizik",
            "university of abuja": "uniabuja",
            "federal university of technology": "fut",
        }
        
        name_lower = name.lower()
        for full_name, abbrev in abbrev_map.items():
            if full_name in name_lower:
                return abbrev
        
        # Generate abbreviation from first letters
        words = name.split()
        if len(words) >= 2:
            # Take first letter of each significant word
            abbrev = "".join([w[0].lower() for w in words if len(w) > 2])
            if len(abbrev) >= 3:
                return abbrev
        
        return None
    
    def _is_valid_website(self, url: str) -> bool:
        """Check if URL is a valid website"""
        if not url:
            return False
        
        # Must start with http:// or https://
        if not url.startswith("http://") and not url.startswith("https://"):
            return False
        
        # Must contain a valid domain
        if not re.search(r"\.(edu\.ng|com|org|net|gov\.ng)", url, re.I):
            return False
        
        # Exclude known non-institution domains
        excluded = ["myschoolgist", "jamb", "nuc", "wikipedia", "facebook", "twitter", "linkedin"]
        if any(excluded_domain in url.lower() for excluded_domain in excluded):
            return False
        
        return True
    
    def _check_domain_exists(self, url: str) -> bool:
        """Check if a domain exists and is accessible"""
        try:
            # Use HEAD request for faster checking
            response = requests.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                return True
            
            # Some servers don't support HEAD, try GET
            response = requests.get(url, timeout=5, allow_redirects=True, stream=True)
            if response.status_code == 200:
                return True
        except:
            pass
        
        return False
    
    def find_websites_batch(self, institutions: List[Dict]) -> Dict[str, str]:
        """Find websites for multiple institutions"""
        websites = {}
        
        for institution in institutions:
            name = institution.get("name", "")
            inst_type = institution.get("type", "")
            
            if not name:
                continue
            
            logger.info(f"Searching website for: {name}")
            website = self.find_website(name, inst_type)
            
            if website:
                websites[name] = website
                logger.info(f"✓ Found website for {name}: {website}")
            else:
                logger.warning(f"✗ No website found for {name}")
            
            # Rate limiting
            time.sleep(self.rate_limit_delay)
        
        return websites


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    scraper = AlternativeWebsiteScraper()
    
    # Test with sample institutions
    test_institutions = [
        {"name": "University of Lagos", "type": "university"},
        {"name": "Ahmadu Bello University", "type": "university"},
        {"name": "Lagos State University", "type": "university"},
    ]
    
    websites = scraper.find_websites_batch(test_institutions)
    print(f"\nFound {len(websites)} websites:")
    for name, website in websites.items():
        print(f"  {name}: {website}")

