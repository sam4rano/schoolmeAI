"""
MySchoolGist Portal Scraper
Scrapes institutions from myschoolgist.com including:
- Private universities
- Federal universities
- State universities
- Schools of nursing
- Teaching hospitals
- Polytechnics
- Colleges of education
"""
import logging
import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from scrapers.shared.base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class MySchoolGistScraper(BaseScraper):
    """Scraper for MySchoolGist portal"""

    def __init__(self):
        super().__init__(
            base_url="https://myschoolgist.com",
            rate_limit_delay=2.0,
            respect_robots=True,
        )

    def scrape_institutions(self) -> List[Dict]:
        """Scrape institutions from MySchoolGist"""
        logger.info("Scraping institutions from MySchoolGist...")
        institutions = []

        # Scrape different institution types
        institution_urls = {
            "private": "https://myschoolgist.com/ng/private-universities-in-nigeria/",
            "federal": "https://myschoolgist.com/ng/federal-universities-in-nigeria/",
            "state": "https://myschoolgist.com/ng/state-universities-in-nigeria/",
            "polytechnic": "https://myschoolgist.com/ng/list-of-accredited-polytechnics-in-nigeria/",
            "college_education": "https://myschoolgist.com/ng/list-of-accredited-colleges-of-education-in-nigeria/",
            "nursing": "https://myschoolgist.com/ng/list-of-schools-of-nursing-in-nigeria/",
            "teaching_hospital": "https://myschoolgist.com/ng/list-of-teaching-hospitals-in-nigeria/",
        }

        for inst_type, url in institution_urls.items():
            try:
                logger.info(f"Scraping {inst_type} institutions from {url}")
                scraped = self._scrape_institution_list(url, inst_type)
                institutions.extend(scraped)
                logger.info(f"Scraped {len(scraped)} {inst_type} institutions")
            except Exception as e:
                logger.error(f"Error scraping {inst_type} institutions: {e}")

        return institutions

    def _scrape_institution_list(self, url: str, inst_type: str) -> List[Dict]:
        """Scrape institution list from a specific URL"""
        response = self.fetch(url)
        if not response:
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        institutions = []

        # Find table with institution data
        table = soup.find("table")
        if not table:
            # Try alternative structure (divs, lists, etc.)
            institutions = self._scrape_alternative_structure(soup, inst_type)
            return institutions

        # Extract table rows
        rows = table.find_all("tr")[1:]  # Skip header row

        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue

            try:
                institution = self._parse_table_row(cells, inst_type, url)
                if institution:
                    institutions.append(institution)
            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue

        return institutions

    def _parse_table_row(self, cells: List, inst_type: str, source_url: str) -> Optional[Dict]:
        """Parse a table row into institution data"""
        # Extract name (usually in first or second column)
        name_cell = cells[1] if len(cells) > 1 else cells[0]
        name_link = name_cell.find("a")
        name = name_link.get_text(strip=True) if name_link else name_cell.get_text(strip=True)
        
        # Ensure name is a string, not a Tag
        if not isinstance(name, str):
            name = str(name).strip()

        if not name or name.lower() in ["s/n", "name", "institution"]:
            return None

        # Extract location from name or separate column
        location = self._extract_location_from_name(name)
        state = location.get("state", "")
        city = location.get("city", "")

        # Extract year established if available
        year_established = None
        if len(cells) > 2:
            year_text = str(cells[-1].get_text(strip=True))
            year_match = re.search(r"\b(19|20)\d{2}\b", year_text)
            if year_match:
                try:
                    year_established = int(year_match.group())
                except (ValueError, AttributeError):
                    year_established = None

        # Extract courses link if available
        courses_url = None
        website = None
        if name_link:
            href = name_link.get("href", "")
            if href:
                courses_url = str(href)
                if courses_url and not courses_url.startswith("http"):
                    courses_url = f"{self.base_url}{courses_url}"
        
        # Try to find website from institution detail page or links
        # Look for common website patterns in the row
        for cell in cells:
            cell_text = cell.get_text(strip=True)
            # Look for URLs
            url_pattern = r"https?://(?:www\.)?([a-zA-Z0-9-]+\.(?:edu\.ng|com|org|net))"
            url_match = re.search(url_pattern, cell_text)
            if url_match:
                website = url_match.group(0)
                break
            
            # Look for links that might be websites
            links = cell.find_all("a", href=True)
            for link in links:
                href = link.get("href", "")
                if href.startswith("http") and any(domain in href for domain in [".edu.ng", ".com", ".org"]):
                    website = href
                    break
            if website:
                break

        # Determine ownership and type
        ownership = self._determine_ownership(inst_type)
        institution_type = self._determine_type(inst_type)

        institution = {
            "name": str(name) if name else "",
            "type": str(institution_type),
            "ownership": str(ownership),
            "state": str(state),
            "city": str(city),
            "website": str(website) if website else None,  # Scraped from page
            "contact": {},
            "accreditationStatus": "accredited",  # Assumed if listed - matches API schema
            "year_established": int(year_established) if year_established else None,
            "courses_url": str(courses_url) if courses_url else None,
            "source_url": str(source_url) if source_url else "",
            "license": "CC-BY-NC-SA",  # MySchoolGist license
        }

        return institution

    def _scrape_alternative_structure(self, soup: BeautifulSoup, inst_type: str) -> List[Dict]:
        """Scrape from alternative HTML structures (lists, divs, etc.)"""
        institutions = []

        # Try to find list items or divs with institution names
        # Look for common patterns
        patterns = [
            soup.find_all("li"),
            soup.find_all("div", class_=re.compile(r"institution|university|school", re.I)),
            soup.select("article ul li"),
            soup.select("main ul li"),
        ]

        for pattern_list in patterns:
            for element in pattern_list:
                text = element.get_text(strip=True)
                if not text or len(text) < 5:
                    continue

                # Check if it looks like an institution name
                if self._looks_like_institution_name(text):
                    location = self._extract_location_from_name(text)
                    canonical_link = soup.find("link", rel="canonical")
                    source_url = str(canonical_link.get("href", "")) if canonical_link else ""
                    
                    institution = {
                        "name": text,
                        "type": self._determine_type(inst_type),
                        "ownership": self._determine_ownership(inst_type),
                        "state": location.get("state", ""),
                        "city": location.get("city", ""),
                        "website": None,
                        "contact": {},
                        "accreditationStatus": "accredited",  # Matches API schema
                        "source_url": source_url,
                        "license": "CC-BY-NC-SA",
                    }
                    institutions.append(institution)

        return institutions

    def _extract_location_from_name(self, name: str) -> Dict[str, str]:
        """Extract state and city from institution name"""
        # Nigerian states list
        states = [
            "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
            "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
            "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna",
            "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
            "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
            "Sokoto", "Taraba", "Yobe", "Zamfara", "Abuja"
        ]

        state = ""
        city = ""

        # Try to find state in name
        for s in states:
            if s.lower() in name.lower():
                state = s
                break

        # Extract city (usually before comma or after "in")
        city_patterns = [
            r"in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r",\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        ]

        for pattern in city_patterns:
            match = re.search(pattern, name, re.I)
            if match:
                potential_city = match.group(1).strip()
                # Don't use state name as city
                if potential_city not in states:
                    city = potential_city
                    break

        return {"state": state, "city": city}

    def _determine_ownership(self, inst_type: str) -> str:
        """Determine ownership from institution type"""
        if "federal" in inst_type:
            return "federal"
        elif "state" in inst_type:
            return "state"
        elif "private" in inst_type:
            return "private"
        return "federal"  # Default

    def _determine_type(self, inst_type: str) -> str:
        """Determine institution type"""
        if "university" in inst_type:
            return "university"
        elif "polytechnic" in inst_type:
            return "polytechnic"
        elif "college" in inst_type or "education" in inst_type:
            return "college"
        elif "nursing" in inst_type:
            return "nursing"
        elif "hospital" in inst_type:
            return "nursing"  # Teaching hospitals are often associated with nursing
        return "university"  # Default

    def _looks_like_institution_name(self, text: str) -> bool:
        """Check if text looks like an institution name"""
        # Institution names usually have certain patterns
        patterns = [
            r"university",
            r"polytechnic",
            r"college",
            r"school",
            r"institute",
        ]

        text_lower = text.lower()
        has_pattern = any(re.search(p, text_lower) for p in patterns)
        is_long_enough = len(text) > 10
        has_capital = text[0].isupper() if text else False

        return has_pattern and is_long_enough and has_capital

    def scrape_programs(self, institution_id: Optional[str] = None) -> List[Dict]:
        """Scrape programs from MySchoolGist"""
        logger.info("Scraping programs from MySchoolGist...")
        programs = []

        # First, get institutions to find their course pages
        institutions = self.scrape_institutions()

        for institution in institutions[:10]:  # Limit for testing
            courses_url = institution.get("courses_url")
            if not courses_url:
                continue

            try:
                logger.info(f"Scraping programs for {institution['name']}")
                institution_programs = self._scrape_programs_from_url(
                    courses_url, institution.get("name", "")
                )
                programs.extend(institution_programs)
            except Exception as e:
                logger.warning(f"Error scraping programs for {institution['name']}: {e}")

        return programs

    def _scrape_programs_from_url(self, url: str, institution_name: str) -> List[Dict]:
        """Scrape programs from a specific institution's courses page"""
        response = self.fetch(url)
        if not response:
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        programs = []

        # Find program lists (could be in various formats)
        program_elements = soup.find_all(["li", "div", "p"], string=re.compile(
            r"(B\.?Sc|B\.?A|B\.?Eng|MBBS|LL\.?B|B\.?Pharm|ND|HND)", re.I
        ))

        for element in program_elements:
            text = element.get_text(strip=True)
            if text:
                programs.append({
                    "name": text,
                    "institution_name": institution_name,
                    "source_url": url,
                })

        return programs

    def scrape_cutoffs(self, program_id: Optional[str] = None) -> List[Dict]:
        """Scrape cutoff history from MySchoolGist"""
        logger.info("Scraping cutoff history from MySchoolGist...")
        cutoffs = []

        # TODO: Implement cutoff scraping
        # This would require finding pages with cutoff data

        return cutoffs


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    scraper = MySchoolGistScraper()
    institutions = scraper.scrape_institutions()
    print(f"\nScraped {len(institutions)} institutions")
    print("\nSample institutions:")
    for inst in institutions[:5]:
        print(f"  - {inst['name']} ({inst['type']}, {inst['ownership']}) - {inst['state']}")
