"""
NBTE (National Board for Technical Education) Scraper
Scrapes polytechnics from various sources
"""
import logging
import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from scrapers.shared.base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class NBTEScraper(BaseScraper):
    """Scraper for NBTE accredited polytechnics"""

    def __init__(self):
        super().__init__(
            base_url="https://myschoolgist.com",
            rate_limit_delay=2.0,
            respect_robots=True,
        )

    def scrape_institutions(self) -> List[Dict]:
        """Scrape polytechnics from various sources"""
        logger.info("Scraping polytechnics from MySchoolGist...")
        institutions = []

        # Scrape from MySchoolGist polytechnics page
        url = "https://myschoolgist.com/ng/list-of-accredited-polytechnics-in-nigeria/"
        response = self.fetch(url)

        if not response:
            logger.error(f"Failed to fetch {url}")
            return institutions

        try:
            soup = BeautifulSoup(response.content, "html.parser")
            institutions = self._parse_polytechnics_page(soup, url)
            logger.info(f"Scraped {len(institutions)} polytechnics from MySchoolGist")
        except Exception as e:
            logger.error(f"Error parsing polytechnics page: {e}")
            return institutions

        return institutions

    def _parse_polytechnics_page(self, soup: BeautifulSoup, source_url: str) -> List[Dict]:
        """Parse polytechnics from MySchoolGist page"""
        institutions = []

        # Find all h2 headings for different categories
        headings = soup.find_all("h2")
        
        for heading in headings:
            heading_text = heading.get_text(strip=True).lower()
            ownership = None
            
            # Determine ownership from heading
            if "federal" in heading_text:
                ownership = "federal"
            elif "state" in heading_text:
                ownership = "state"
            elif "private" in heading_text:
                ownership = "private"
            
            if not ownership:
                continue

            # Find the next ul list after this heading
            ul = heading.find_next_sibling("ul")
            if not ul:
                # Try finding ul with class "oneli"
                ul = heading.find_next("ul", class_="oneli")
            
            if not ul:
                continue

            # Extract polytechnic names from list items
            list_items = ul.find_all("li")
            for li in list_items:
                name = li.get_text(strip=True)
                if not name or len(name) < 3:
                    continue

                # Extract state and city from name if available
                state, city = self._extract_location_from_name(name)

                institution = {
                    "name": name,
                    "type": "polytechnic",
                    "ownership": ownership,
                    "state": state,
                    "city": city,
                    "website": None,
                    "accreditationStatus": "accredited",  # If on NBTE list, assume accredited
                    "source_url": source_url,
                    "license": "MySchoolGist",
                }

                # Only include contact if it has data (schema expects object or undefined, not null)
                # For now, we don't have contact data, so we omit it

                institutions.append(institution)

        return institutions

    def _extract_location_from_name(self, name: str) -> tuple[str, str]:
        """Extract state and city from polytechnic name"""
        state = "Unknown"
        city = "Unknown"

        # Common patterns: "Polytechnic, City" or "Polytechnic, City, State"
        # Or "State Polytechnic, City"
        if "," in name:
            parts = [p.strip() for p in name.split(",")]
            if len(parts) >= 2:
                city = parts[-1].strip()
                # If last part looks like a state, use it
                if city in self._get_nigerian_states():
                    state = city
                    city = parts[-2].strip() if len(parts) > 2 else "Unknown"
                else:
                    # Try to find state in name
                    for part in parts:
                        if part in self._get_nigerian_states():
                            state = part
                            break

        # Check if state is mentioned in name
        states = self._get_nigerian_states()
        for nigerian_state in states:
            if nigerian_state.lower() in name.lower():
                state = nigerian_state
                break

        return state, city

    def _get_nigerian_states(self) -> List[str]:
        """Get list of Nigerian states"""
        return [
            "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
            "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
            "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
            "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
            "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
            "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT", "Abuja",
        ]

    def scrape_programs(self, institution_id: Optional[str] = None) -> List[Dict]:
        """Scrape programs from NBTE (not applicable for polytechnics)"""
        logger.info("NBTE scraper does not scrape programs")
        return []

    def scrape_cutoffs(self, program_id: Optional[str] = None) -> List[Dict]:
        """Scrape cutoff history from NBTE (not applicable)"""
        logger.info("NBTE scraper does not scrape cutoffs")
        return []


if __name__ == "__main__":
    import sys
    import json

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    scraper = NBTEScraper()
    institutions = scraper.scrape_institutions()

    if institutions:
        print(f"\nScraped {len(institutions)} polytechnics")
        print("\nFirst 10 polytechnics:")
        for i, inst in enumerate(institutions[:10], 1):
            print(f"{i}. {inst['name']} ({inst['state']}) - {inst['ownership']}")

        # Save to JSON
        output_file = "scraped_nbte_polytechnics.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(institutions, f, indent=2, ensure_ascii=False)
        print(f"\nSaved to {output_file}")
    else:
        print("No polytechnics scraped")
        sys.exit(1)

