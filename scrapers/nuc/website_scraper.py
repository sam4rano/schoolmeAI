"""
NUC Website Scraper
Scrapes institution websites from Nigerian Universities Commission (NUC) website
"""
import logging
import re
import time
import requests
from typing import Dict, List, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class NUCWebsiteScraper:
    """Scraper for institution websites from NUC website"""

    def __init__(self):
        self.base_url = "https://www.nuc.edu.ng"
        self.rate_limit_delay = 2.0
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
    
    def fetch(self, url: str) -> Optional[requests.Response]:
        """Fetch a URL with rate limiting"""
        try:
            time.sleep(self.rate_limit_delay)
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def scrape_institution_websites(self) -> Dict[str, str]:
        """Scrape institution websites from NUC website"""
        websites = {}
        
        # NUC has various pages with institution information
        nuc_urls = [
            "https://www.nuc.edu.ng/nigerian-universities/",
            "https://www.nuc.edu.ng/approved-universities/",
            "https://www.nuc.edu.ng/universities/",
        ]
        
        for url in nuc_urls:
            try:
                response = self.fetch(url)
                if not response:
                    continue
                
                soup = BeautifulSoup(response.content, "html.parser")
                
                # Look for tables with institution information
                tables = soup.find_all("table")
                for table in tables:
                    rows = table.find_all("tr")[1:]  # Skip header
                    for row in rows:
                        cells = row.find_all(["td", "th"])
                        if len(cells) >= 2:
                            # Institution name is usually in first or second column
                            name_cell = cells[0] if len(cells) > 0 else None
                            website_cell = None
                            
                            # Look for website in any cell
                            for cell in cells:
                                links = cell.find_all("a", href=True)
                                for link in links:
                                    href = link.get("href", "")
                                    if href and ("http://" in href or "https://" in href):
                                        # Check if it's a website URL
                                        if any(domain in href for domain in [".edu.ng", ".com", ".org", ".net"]):
                                            if "nuc.edu.ng" not in href and "myschoolgist" not in href:
                                                website_cell = href
                                                break
                                
                                # Also check cell text for URLs
                                if not website_cell:
                                    cell_text = cell.get_text(strip=True)
                                    url_match = re.search(r"https?://[^\s]+", cell_text)
                                    if url_match:
                                        url = url_match.group(0)
                                        if any(domain in url for domain in [".edu.ng", ".com", ".org", ".net"]):
                                            if "nuc.edu.ng" not in url and "myschoolgist" not in url:
                                                website_cell = url
                                                break
                                
                                if website_cell:
                                    break
                            
                            if name_cell and website_cell:
                                name = name_cell.get_text(strip=True)
                                # Normalize name
                                name = self._normalize_name(name)
                                if name:
                                    websites[name] = website_cell
                                    logger.debug(f"Found website for {name}: {website_cell}")
                
                # Also look for lists with institution information
                lists = soup.find_all(["ul", "ol"])
                for list_elem in lists:
                    items = list_elem.find_all("li")
                    for item in items:
                        text = item.get_text(strip=True)
                        # Look for pattern: "Institution Name - website"
                        match = re.search(r"(.+?)\s*[-–]\s*(https?://[^\s]+)", text)
                        if match:
                            name = self._normalize_name(match.group(1))
                            website = match.group(2)
                            if name and website:
                                websites[name] = website
                                logger.debug(f"Found website for {name}: {website}")
                
                logger.info(f"Scraped {len(websites)} websites from {url}")
                
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                continue
        
        logger.info(f"Total websites scraped from NUC: {len(websites)}")
        return websites

    def _normalize_name(self, name: str) -> str:
        """Normalize institution name for matching"""
        if not name:
            return ""
        
        # Remove common prefixes/suffixes
        name = re.sub(r"^(The|A)\s+", "", name, flags=re.I)
        name = re.sub(r"\s+(University|Polytechnic|College|Institute|School)$", "", name, flags=re.I)
        
        # Remove extra whitespace
        name = " ".join(name.split())
        
        return name.strip()

    def scrape_from_other_sources(self) -> Dict[str, str]:
        """Scrape websites from other official sources"""
        websites = {}
        
        # JAMB website might have institution information
        jamb_urls = [
            "https://www.jamb.gov.ng/Institutions",
            "https://www.jamb.gov.ng/InstitutionList",
        ]
        
        for url in jamb_urls:
            try:
                response = self.fetch(url)
                if not response:
                    continue
                
                soup = BeautifulSoup(response.content, "html.parser")
                
                # Look for institution links
                links = soup.find_all("a", href=True)
                for link in links:
                    href = link.get("href", "")
                    text = link.get_text(strip=True)
                    
                    # Check if it's an institution website
                    if any(domain in href for domain in [".edu.ng", ".com", ".org", ".net"]):
                        if "jamb.gov.ng" not in href and "myschoolgist" not in href:
                            name = self._normalize_name(text)
                            if name:
                                websites[name] = href
                                logger.debug(f"Found website from JAMB for {name}: {href}")
                
                logger.info(f"Scraped {len(websites)} websites from {url}")
                
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                continue
        
        return websites


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    scraper = NUCWebsiteScraper()
    websites = scraper.scrape_institution_websites()
    print(f"\nScraped {len(websites)} institution websites")
    if websites:
        print("\nSample websites:")
        for name, website in list(websites.items())[:5]:
            print(f"  {name}: {website}")

