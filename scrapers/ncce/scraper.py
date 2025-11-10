"""
NCCE (National Commission for Colleges of Education) Scraper
Scrapes accredited colleges of education from https://ncce.gov.ng/AccreditedColleges
"""
import logging
import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from scrapers.shared.base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class NCCEScraper(BaseScraper):
    """Scraper for NCCE accredited colleges of education"""

    def __init__(self):
        super().__init__(
            base_url="https://ncce.gov.ng",
            rate_limit_delay=2.0,
            respect_robots=True,
        )

    def scrape_institutions(self) -> List[Dict]:
        """Scrape colleges of education from NCCE"""
        logger.info("Scraping colleges of education from NCCE...")
        institutions = []

        url = "https://ncce.gov.ng/AccreditedColleges"
        response = self.fetch(url)

        if not response:
            logger.error(f"Failed to fetch {url}")
            return institutions

        try:
            soup = BeautifulSoup(response.content, "html.parser")
            institutions = self._parse_colleges_table(soup, url)
            logger.info(f"Scraped {len(institutions)} colleges of education from NCCE")
        except Exception as e:
            logger.error(f"Error parsing NCCE page: {e}")
            return institutions

        return institutions

    def _parse_colleges_table(self, soup: BeautifulSoup, source_url: str) -> List[Dict]:
        """Parse colleges table from NCCE page"""
        institutions = []

        # Find the table - it might be in different structures
        table = soup.find("table")
        if not table:
            # Try finding by class or id
            table = soup.find("table", class_=re.compile(r"table|data|list", re.I))
            if not table:
                # Try finding by div with table-like structure
                table_div = soup.find("div", class_=re.compile(r"table|data|list", re.I))
                if table_div:
                    table = table_div.find("table")

        if not table:
            logger.warning("Could not find colleges table on NCCE page")
            return institutions

        # Find table headers
        headers = []
        header_row = table.find("thead")
        if header_row:
            header_cells = header_row.find_all(["th", "td"])
            headers = [cell.get_text(strip=True) for cell in header_cells]
        else:
            # Try first row as headers
            first_row = table.find("tr")
            if first_row:
                header_cells = first_row.find_all(["th", "td"])
                headers = [cell.get_text(strip=True) for cell in header_cells]

        # Normalize header names
        header_map = {
            "s/n": "sn",
            "serial number": "sn",
            "name": "name",
            "provost": "provost",
            "college ownership": "ownership",
            "ownership": "ownership",
            "state": "state",
            "website": "website",
            "email": "email",
            "status": "status",
        }

        normalized_headers = []
        for header in headers:
            header_lower = header.lower()
            normalized = header_map.get(header_lower, header_lower.replace(" ", "_"))
            normalized_headers.append(normalized)

        # Find all data rows
        rows = table.find_all("tr")
        if headers and rows[0] in rows:
            # Skip header row if it's in rows
            rows = rows[1:]

        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:  # Skip rows with insufficient data
                continue

            # Extract data from cells
            row_data = {}
            for i, cell in enumerate(cells):
                if i < len(normalized_headers):
                    header = normalized_headers[i]
                    text = cell.get_text(strip=True)
                    # Extract links (for website/email)
                    link = cell.find("a")
                    if link and link.get("href"):
                        href = link.get("href")
                        if href.startswith("mailto:"):
                            row_data["email"] = href.replace("mailto:", "")
                        elif href.startswith("http"):
                            row_data["website"] = href
                        else:
                            row_data[header] = text
                    else:
                        row_data[header] = text

            # Skip if no name
            if not row_data.get("name"):
                continue

            # Normalize and create institution
            institution = self._normalize_college_data(row_data, source_url)
            if institution:
                institutions.append(institution)

        return institutions

    def _normalize_college_data(self, row_data: Dict, source_url: str) -> Optional[Dict]:
        """Normalize college data to institution format"""
        name = row_data.get("name", "").strip()
        if not name:
            return None

        # Remove "OPEN" suffix from name if present
        name = re.sub(r"OPEN\s*$", "", name, flags=re.IGNORECASE).strip()

        # Extract state from name or state field
        state = row_data.get("state", "").strip()
        if not state:
            # Try to extract from name (e.g., "Adamu Augie College of Education, Argungu")
            # This is a fallback - ideally state should be in the data
            state = "Unknown"

        # Extract city from name (usually after comma)
        city = "Unknown"
        if "," in name:
            parts = name.split(",")
            if len(parts) > 1:
                city = parts[-1].strip()
                # Remove "OPEN" suffix from city if present
                city = re.sub(r"OPEN\s*$", "", city, flags=re.IGNORECASE).strip()
                if not city:
                    city = "Unknown"

        # Determine ownership from "College Ownership" field
        ownership_str = row_data.get("ownership", "").lower()
        if "state" in ownership_str:
            ownership = "state"
        elif "private" in ownership_str:
            ownership = "private"
        elif "federal" in ownership_str:
            ownership = "federal"
        else:
            # Default to state for colleges of education
            ownership = "state"

        # Extract website and email
        website = row_data.get("website", "").strip()
        email = row_data.get("email", "").strip()

        # Filter out invalid website values
        invalid_website_values = ["not available", "n/a", "na", "none", "", "null"]
        if website and website.lower() in invalid_website_values:
            website = None

        # If website is an email address, extract it
        if website and "@" in website and not website.startswith("http"):
            email = website
            website = None
        elif website and not website.startswith("http"):
            # Try to construct URL from email domain
            if "@" in website:
                domain = website.split("@")[1]
                website = f"https://{domain}"
            else:
                # Check if it's a valid domain name
                if "." in website and not " " in website and website.lower() not in invalid_website_values:
                    website = f"https://{website}"
                else:
                    website = None
        elif website and not (website.startswith("http://") or website.startswith("https://")):
            # Add https:// if missing
            if "." in website and not " " in website:
                website = f"https://{website}"
            else:
                website = None

        # Extract email from website if it's a mailto link
        if website and "mailto:" in website:
            email = website.replace("mailto:", "").split("?")[0]
            website = None

        # Check if website contains invalid text
        if website and ("not available" in website.lower() or "n/a" in website.lower() or "na" in website.lower()):
            website = None

        # Extract provost (head of institution)
        provost = row_data.get("provost", "").strip()

        # Build contact object (must match schema: email, phone, address)
        # Schema expects object or undefined, not null
        contact = {}
        if email:
            contact["email"] = email
        if provost:
            # Store provost in address field since schema doesn't have provost
            contact["address"] = f"Provost: {provost}"

        # Only include contact if it has data
        contact_data = contact if contact else None

        # Validate website URL format
        if website:
            # Basic URL validation
            if not (website.startswith("http://") or website.startswith("https://")):
                # If it's not a valid URL, try to make it one
                if "." in website and not "@" in website and not " " in website:
                    # Looks like a domain name
                    website = f"https://{website}"
                else:
                    # If it looks like an email or invalid, set to None
                    website = None
            
            # Final validation - check if it's a valid URL format
            if website:
                # Basic URL format check
                if not ("." in website.replace("https://", "").replace("http://", "") or 
                        website.startswith("http://localhost") or 
                        website.startswith("https://localhost")):
                    # Invalid URL format
                    website = None

        # Check status (OPEN/CLOSED)
        status = row_data.get("status", "").upper()
        accreditation_status = "accredited" if "OPEN" in status or not status else "unknown"

        # Build result object - only include contact if it has data
        result = {
            "name": name,
            "type": "college",
            "ownership": ownership,
            "state": state if state else "Unknown",
            "city": city if city else "Unknown",
            "website": website if website else None,
            "accreditationStatus": accreditation_status,
            "source_url": source_url,
            "license": "NCCE Official Data",
        }

        # Only add contact if it has data (schema expects object or undefined, not null)
        if contact_data:
            result["contact"] = contact_data

        return result

    def scrape_programs(self, institution_id: Optional[str] = None) -> List[Dict]:
        """Scrape programs from NCCE (not applicable for colleges)"""
        logger.info("NCCE scraper does not scrape programs")
        return []

    def scrape_cutoffs(self, program_id: Optional[str] = None) -> List[Dict]:
        """Scrape cutoff history from NCCE (not applicable)"""
        logger.info("NCCE scraper does not scrape cutoffs")
        return []


if __name__ == "__main__":
    import sys
    import json

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    scraper = NCCEScraper()
    institutions = scraper.scrape_institutions()

    if institutions:
        print(f"\nScraped {len(institutions)} colleges of education")
        print("\nFirst 5 colleges:")
        for i, inst in enumerate(institutions[:5], 1):
            print(f"{i}. {inst['name']} ({inst['state']}) - {inst['ownership']}")

        # Save to JSON
        output_file = "scraped_ncce_colleges.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(institutions, f, indent=2, ensure_ascii=False)
        print(f"\nSaved to {output_file}")
    else:
        print("No colleges scraped")
        sys.exit(1)

