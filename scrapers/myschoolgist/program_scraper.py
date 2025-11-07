"""
Program Details Scraper for MySchoolGist
Scrapes detailed program information from course pages
"""
import logging
import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from scrapers.shared.base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class ProgramDetailsScraper(BaseScraper):
    """Scraper for program details from MySchoolGist course pages"""

    def __init__(self):
        super().__init__(
            base_url="https://myschoolgist.com",
            rate_limit_delay=2.0,
            respect_robots=True,
        )

    def scrape_program_details(self, courses_url: str, institution_name: str) -> Optional[Dict]:
        """Scrape detailed program information from a courses page"""
        response = self.fetch(courses_url)
        if not response:
            return None

        soup = BeautifulSoup(response.content, "html.parser")
        programs = []

        # Find program lists - could be in various formats
        # Look for common patterns: lists, tables, divs with program names
        
        # Pattern 1: List items with program names
        list_items = soup.find_all("li")
        for item in list_items:
            text = item.get_text(strip=True)
            if self._is_program_name(text):
                program = self._extract_program_info(text, institution_name, courses_url, soup)
                if program:
                    programs.append(program)

        # Pattern 2: Table rows
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")[1:]  # Skip header
            for row in rows:
                cells = row.find_all(["td", "th"])
                if len(cells) >= 1:
                    text = cells[0].get_text(strip=True)
                    if self._is_program_name(text):
                        program = self._extract_program_info(text, institution_name, courses_url, soup)
                        if program:
                            programs.append(program)

        # Pattern 3: Divs with program names
        divs = soup.find_all("div", class_=re.compile(r"course|program", re.I))
        for div in divs:
            text = div.get_text(strip=True)
            if self._is_program_name(text):
                program = self._extract_program_info(text, institution_name, courses_url, soup)
                if program:
                    programs.append(program)

        return programs

    def _is_program_name(self, text: str) -> bool:
        """Check if text looks like a program name"""
        if not text or len(text) < 5:
            return False

        # Common program patterns
        patterns = [
            r"\b(B\.?Sc|B\.?A|B\.?Eng|B\.?Tech|B\.?Ed|LL\.?B|MBBS|B\.?Pharm|B\.?Agric|B\.?Arch|B\.?Vet|ND|HND|NCE|OND)\b",
            r"\b(Computer Science|Engineering|Medicine|Law|Pharmacy|Agriculture|Architecture|Education)\b",
            r"\b(Accounting|Business|Economics|Mass Communication|Political Science|Sociology|Psychology)\b",
        ]

        text_lower = text.lower()
        return any(re.search(p, text_lower, re.I) for p in patterns)

    def _extract_program_info(
        self, program_text: str, institution_name: str, source_url: str, soup: BeautifulSoup
    ) -> Optional[Dict]:
        """Extract program information from text and page context"""
        # Extract degree type
        degree_type = self._extract_degree_type(program_text)

        # Extract UTME subjects (common patterns)
        utme_subjects = self._extract_utme_subjects(program_text, soup)

        # Extract O-level subjects
        olevel_subjects = self._extract_olevel_subjects(program_text, soup)

        # Extract duration
        duration = self._extract_duration(program_text, soup)

        # Extract admission requirements
        admission_requirements = self._extract_admission_requirements(program_text, soup)

        # Extract description
        description = self._extract_description(program_text, soup)

        # Extract career prospects
        career_prospects = self._extract_career_prospects(program_text, soup)

        program = {
            "name": program_text.strip(),
            "institution_name": institution_name,
            "degreeType": degree_type,
            "utmeSubjects": utme_subjects,
            "olevelSubjects": olevel_subjects,
            "duration": duration,
            "description": description,
            "admissionRequirements": admission_requirements,
            "careerProspects": career_prospects,
            "source_url": source_url,
        }

        return program

    def _extract_degree_type(self, text: str) -> Optional[str]:
        """Extract degree type from text"""
        degree_patterns = {
            r"\bB\.?Sc\b": "BSc",
            r"\bB\.?A\b": "BA",
            r"\bB\.?Eng\b": "BEng",
            r"\bB\.?Tech\b": "BTech",
            r"\bB\.?Ed\b": "BEd",
            r"\bLL\.?B\b": "LLB",
            r"\bMBBS\b": "MBBS",
            r"\bB\.?Pharm\b": "BPharm",
            r"\bB\.?Agric\b": "BAgric",
            r"\bB\.?Arch\b": "BArch",
            r"\bB\.?Vet\b": "BVet",
            r"\bND\b": "ND",
            r"\bHND\b": "HND",
            r"\bNCE\b": "NCE",
            r"\bOND\b": "OND",
        }

        for pattern, degree in degree_patterns.items():
            if re.search(pattern, text, re.I):
                return degree

        return None

    def _extract_utme_subjects(self, text: str, soup: BeautifulSoup) -> List[str]:
        """Extract required UTME subjects"""
        subjects = []
        
        # Common UTME subjects
        common_subjects = [
            "Mathematics", "English", "Physics", "Chemistry", "Biology",
            "Economics", "Government", "Literature", "Geography", "History",
            "Commerce", "Accounting", "Agricultural Science", "CRS", "IRS",
        ]

        # Look for subject mentions in text
        text_lower = text.lower()
        for subject in common_subjects:
            if subject.lower() in text_lower:
                subjects.append(subject)

        # Look for subject combinations in page
        subject_patterns = [
            r"UTME\s+subjects?[:\s]+([A-Za-z,\s]+)",
            r"JAMB\s+subjects?[:\s]+([A-Za-z,\s]+)",
            r"Required\s+subjects?[:\s]+([A-Za-z,\s]+)",
        ]

        page_text = soup.get_text()
        for pattern in subject_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                found_subjects = [s.strip() for s in match.group(1).split(",")]
                subjects.extend([s for s in found_subjects if s in common_subjects])

        return list(set(subjects))  # Remove duplicates

    def _extract_olevel_subjects(self, text: str, soup: BeautifulSoup) -> List[str]:
        """Extract required O-level subjects"""
        subjects = []
        
        common_subjects = [
            "Mathematics", "English", "Physics", "Chemistry", "Biology",
            "Economics", "Government", "Literature", "Geography", "History",
            "Commerce", "Accounting", "Agricultural Science", "CRS", "IRS",
        ]

        # Look for O-level requirements
        page_text = soup.get_text()
        olevel_patterns = [
            r"O['\s]?level\s+subjects?[:\s]+([A-Za-z,\s]+)",
            r"O['\s]?level\s+requirements?[:\s]+([A-Za-z,\s]+)",
            r"WAEC\s+subjects?[:\s]+([A-Za-z,\s]+)",
        ]

        for pattern in olevel_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                found_subjects = [s.strip() for s in match.group(1).split(",")]
                subjects.extend([s for s in found_subjects if s in common_subjects])

        return list(set(subjects))

    def _extract_duration(self, text: str, soup: BeautifulSoup) -> Optional[str]:
        """Extract program duration"""
        duration_patterns = [
            r"(\d+)\s*years?",
            r"Duration[:\s]+(\d+)\s*years?",
            r"(\d+)\s*year\s+program",
        ]

        page_text = soup.get_text()
        for pattern in duration_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                years = match.group(1)
                return f"{years} years"

        return None

    def _extract_admission_requirements(self, text: str, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract admission requirements"""
        requirements = {}

        page_text = soup.get_text()

        # Extract JAMB score requirement
        jamb_patterns = [
            r"JAMB\s+score[:\s]+(\d+)",
            r"UTME\s+score[:\s]+(\d+)",
            r"minimum\s+(\d+)\s+in\s+JAMB",
        ]

        for pattern in jamb_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                requirements["jamb_score"] = int(match.group(1))
                break

        # Extract O-level requirements
        olevel_pattern = r"O['\s]?level[:\s]+([A-Z0-9,\s]+)"
        match = re.search(olevel_pattern, page_text, re.I)
        if match:
            requirements["olevel_requirements"] = match.group(1).strip()

        return requirements if requirements else None

    def _extract_description(self, text: str, soup: BeautifulSoup) -> Optional[str]:
        """Extract program description"""
        # Look for description paragraphs
        paragraphs = soup.find_all("p")
        for p in paragraphs:
            p_text = p.get_text(strip=True)
            if len(p_text) > 50 and any(word in p_text.lower() for word in ["program", "course", "study", "degree"]):
                return p_text[:500]  # Limit to 500 chars

        return None

    def _extract_career_prospects(self, text: str, soup: BeautifulSoup) -> List[str]:
        """Extract career prospects"""
        prospects = []

        page_text = soup.get_text()
        
        # Look for career section
        career_patterns = [
            r"career\s+opportunities?[:\s]+([^.]+)",
            r"job\s+opportunities?[:\s]+([^.]+)",
            r"graduates?\s+can\s+work\s+as[:\s]+([^.]+)",
        ]

        for pattern in career_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                careers = [c.strip() for c in match.group(1).split(",")]
                prospects.extend(careers[:10])  # Limit to 10
                break

        return prospects


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    scraper = ProgramDetailsScraper()
    # Test with a sample URL
    test_url = "https://myschoolgist.com/ng/list-of-available-courses-in-adeleke-university/"
    programs = scraper.scrape_program_details(test_url, "Adeleke University")
    print(f"\nScraped {len(programs)} programs")
    if programs:
        print("\nSample program:")
        print(programs[0])

