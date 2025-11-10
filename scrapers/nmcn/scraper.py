"""
NMCN (Nursing and Midwifery Council of Nigeria) Scraper
Scrapes approved schools of nursing from official PDF
"""
import logging
import re
from typing import Dict, List, Optional
import requests
from scrapers.shared.base_scraper import BaseScraper

logger = logging.getLogger(__name__)

try:
    import pdfplumber
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    logger.warning("pdfplumber not installed. Install with: pip install pdfplumber")


class NMCNScraper(BaseScraper):
    """Scraper for NMCN approved schools of nursing"""

    def __init__(self):
        super().__init__(
            base_url="https://nmcn.gov.ng",
            rate_limit_delay=2.0,
            respect_robots=True,
        )

    def scrape_institutions(self) -> List[Dict]:
        """Scrape approved schools of nursing from NMCN PDF"""
        logger.info("Scraping approved schools of nursing from NMCN PDF...")
        institutions = []

        if not PDF_SUPPORT:
            logger.error("pdfplumber not installed. Cannot parse PDF.")
            return institutions

        # Official NMCN PDF with approved schools
        pdf_url = "https://nmcn.gov.ng/wp-content/uploads/2025/07/New_List_of_Approved_Schools_2025.pdf"
        
        try:
            response = self.fetch(pdf_url)
            if not response:
                logger.error(f"Failed to fetch PDF from {pdf_url}")
                return institutions

            # Parse PDF
            institutions = self._parse_pdf(response.content, pdf_url)
            logger.info(f"Scraped {len(institutions)} approved schools of nursing from NMCN PDF")
        except Exception as e:
            logger.error(f"Error parsing NMCN PDF: {e}", exc_info=True)
            return institutions

        return institutions

    def _parse_pdf(self, pdf_content: bytes, source_url: str) -> List[Dict]:
        """Parse PDF content to extract approved schools"""
        institutions = []

        try:
            import io
            import pdfplumber

            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    try:
                        text = page.extract_text()
                        if not text:
                            continue

                        # Extract schools from page text
                        page_schools = self._extract_schools_from_text(text, source_url, page_num)
                        institutions.extend(page_schools)
                    except Exception as e:
                        logger.warning(f"Error parsing page {page_num}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Error opening PDF: {e}")
            return institutions

        return institutions

    def _extract_schools_from_text(self, text: str, source_url: str, page_num: int) -> List[Dict]:
        """Extract school names and details from PDF text"""
        institutions = []

        # Common patterns for school names in PDFs
        # Lines that look like school names (usually start with numbers or are capitalized)
        lines = text.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue

            # Skip headers, footers, and page numbers
            if any(skip in line.lower() for skip in [
                "page", "nmcn", "nursing", "midwifery", "council", "approved",
                "schools", "list", "of", "nigeria", "2025", "2024", "2023",
                "s/n", "serial", "number", "no.", "name", "address", "state",
            ]):
                # Check if it's actually a school name (not just a header)
                if not re.search(r'\d+', line) and len(line) < 30:
                    continue

            # Try to extract school name
            school_name = self._normalize_school_name(line)
            if not school_name or len(school_name) < 5:
                continue

            # Extract state and city from name if available
            state, city = self._extract_location_from_name(school_name)

            institution = {
                "name": school_name,
                "type": "nursing",
                "ownership": self._determine_ownership(school_name),
                "state": state,
                "city": city,
                "website": None,
                "accreditationStatus": "accredited",  # If on NMCN list, it's approved
                "source_url": source_url,
                "license": "NMCN Official Data 2025",
            }

            institutions.append(institution)

        return institutions

    def _normalize_school_name(self, text: str) -> Optional[str]:
        """Normalize school name from PDF text"""
        # Remove common prefixes and suffixes
        text = re.sub(r'^\d+[\.\)]\s*', '', text)  # Remove leading numbers
        text = re.sub(r'^\s*[A-Z]\.\s*', '', text)  # Remove letter prefixes
        text = text.strip()
        
        # Remove common suffixes
        text = re.sub(r'\s*\(.*?\)\s*$', '', text)  # Remove parenthetical notes
        text = re.sub(r'\s*,\s*$', '', text)  # Remove trailing commas
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Skip if it looks like a header or metadata
        if any(skip in text.lower() for skip in [
            "school of nursing", "school of midwifery", "college of nursing",
            "teaching hospital", "general hospital", "federal medical centre",
        ]):
            # This might be part of a school name, keep it
            pass
        
        return text if len(text) >= 5 else None

    def _extract_location_from_name(self, name: str) -> tuple[str, str]:
        """Extract state and city from school name"""
        state = "Unknown"
        city = "Unknown"

        # Common patterns: "School of Nursing, City" or "School of Nursing, City, State"
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

        # Try to extract city from common patterns
        city_patterns = [
            r"School of Nursing[,\s]+([A-Z][a-z]+)",
            r"([A-Z][a-z]+)\s+School of Nursing",
            r"([A-Z][a-z]+)\s+Teaching Hospital",
        ]
        
        for pattern in city_patterns:
            match = re.search(pattern, name)
            if match:
                potential_city = match.group(1)
                if potential_city not in states:
                    city = potential_city
                    break

        return state, city

    def _determine_ownership(self, name: str) -> str:
        """Determine ownership from school name"""
        name_lower = name.lower()
        
        if "federal" in name_lower or "fct" in name_lower or "abuja" in name_lower:
            return "federal"
        elif "state" in name_lower:
            return "state"
        elif any(word in name_lower for word in ["private", "mission", "church", "catholic", "anglican"]):
            return "private"
        else:
            # Default to state (most nursing schools are state-owned)
            return "state"

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
        """Scrape programs from NMCN (not applicable for nursing schools)"""
        logger.info("NMCN scraper does not scrape programs")
        return []

    def scrape_cutoffs(self, program_id: Optional[str] = None) -> List[Dict]:
        """Scrape cutoff history from NMCN (not applicable)"""
        logger.info("NMCN scraper does not scrape cutoffs")
        return []


if __name__ == "__main__":
    import sys
    import json

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    if not PDF_SUPPORT:
        print("Error: pdfplumber not installed. Install with: pip install pdfplumber")
        sys.exit(1)

    scraper = NMCNScraper()
    institutions = scraper.scrape_institutions()

    if institutions:
        print(f"\nScraped {len(institutions)} approved schools of nursing")
        print("\nFirst 10 schools:")
        for i, inst in enumerate(institutions[:10], 1):
            print(f"{i}. {inst['name']} ({inst['state']}) - {inst['ownership']}")

        # Save to JSON
        output_file = "scraped_nmcn_nursing_schools.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(institutions, f, indent=2, ensure_ascii=False)
        print(f"\nSaved to {output_file}")
    else:
        print("No schools scraped")
        sys.exit(1)

