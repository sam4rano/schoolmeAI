"""
Program Scraper for MySchoolGist
Scrapes programs/courses from institution course pages
"""
import logging
import re
import json
import time
import requests
from typing import Dict, List, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ProgramScraper:
    """Scraper for programs from MySchoolGist course pages"""

    def __init__(self):
        self.base_url = "https://myschoolgist.com"
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

    def scrape_programs_from_url(self, courses_url: str, institution_name: str, institution_id: str) -> List[Dict]:
        """Scrape programs from a courses URL"""
        if not courses_url:
            return []

        response = self.fetch(courses_url)
        if not response:
            logger.warning(f"Could not fetch courses URL: {courses_url}")
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        programs = []

        # Try multiple patterns to find program lists
        # Pattern 1: List items
        list_items = soup.find_all("li")
        for item in list_items:
            text = item.get_text(strip=True)
            if self._is_program_name(text):
                program = self._extract_program_info(text, institution_name, institution_id, courses_url, soup)
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
                        program = self._extract_program_info(text, institution_name, institution_id, courses_url, soup)
                        if program:
                            programs.append(program)

        # Pattern 3: Divs with program names
        divs = soup.find_all("div", class_=re.compile(r"course|program|subject", re.I))
        for div in divs:
            text = div.get_text(strip=True)
            if self._is_program_name(text):
                program = self._extract_program_info(text, institution_name, institution_id, courses_url, soup)
                if program:
                    programs.append(program)

        # Pattern 4: Paragraphs with program names
        paragraphs = soup.find_all("p")
        for p in paragraphs:
            text = p.get_text(strip=True)
            if self._is_program_name(text) and len(text) < 200:  # Avoid long paragraphs
                program = self._extract_program_info(text, institution_name, institution_id, courses_url, soup)
                if program:
                    programs.append(program)

        # Deduplicate by name
        seen = set()
        unique_programs = []
        for program in programs:
            name_key = program["name"].lower().strip()
            if name_key not in seen:
                seen.add(name_key)
                unique_programs.append(program)

        logger.info(f"Scraped {len(unique_programs)} unique programs from {courses_url}")
        return unique_programs

    def _is_program_name(self, text: str) -> bool:
        """Check if text looks like a program name"""
        if not text or len(text) < 5 or len(text) > 200:
            return False

        text_lower = text.lower().strip()
        
        # Skip common non-program text (announcements, headers, etc.)
        skip_patterns = [
            r"^(s/n|no\.|number|name|program|course|faculty|department)",
            r"^(click|read|view|see|more|less)",
            r"^(admission|requirement|cutoff|jamb|utme)",
            r"^(\d+)$",  # Just numbers
            r"\d{4}[/-]\d{4}",  # Years like 2020/2021 (announcements)
            r"admission\s+into",  # Admission announcements
            r"screening\s+examination",  # Exam announcements
            r"list\s+of",  # List headers
            r"final\s+list",  # Admission lists
            r"second\s+list|third\s+list|fourth\s+list",  # Multiple lists
            r"according\s+to",  # Rankings/statements
            r"times\s+higher\s+education",  # Rankings
            r"world\s+university\s+ranking",  # Rankings
            r"centre\s+of\s+excellence|center\s+of\s+excellence",  # Research centers (not programs)
            r"facts\s+and\s+figures",  # Information pages
            r"^history,?\s*",  # History pages
            r"call\s+for\s+papers",  # Journal calls
            r"byadmin|bypublication",  # News articles
            r"journal\s+of",  # Journal names
            r"volume\s+\d+|issue\s+\d+",  # Journal volumes/issues
            r"campus\s+life",  # Campus information
            r"official\s+news",  # News articles
            r"^(college|centre|center|institute|school)\s+(of|for)\s+",  # Institution names (not programs)
            r"campuses",  # Campus listings
            r"©\s+\d{4}",  # Copyright notices
            r"all\s+rights\s+reserved",  # Copyright text
            r"designed\s+by",  # Footer text
            r"^(dean|director|professor|dr\.|prof\.)\s+",  # Titles/positions
            r"student$",  # "Computer Science Student" etc
            r"^adeyemi\s+college",  # Institution names
            r"^africa\s+centre",  # Research centers
            r"^ace\s+",  # Centers of excellence
            r"international\s+conference",  # Conference announcements
            r"^about",  # About pages
            r"philosophy|objectives|vision|mission",  # Institution info pages
            r"sensitises|staff",  # News articles
            r"centre\s+for\s+information",  # IT centers
            r"applied\s+research\s+&\s+technology",  # Research centers
        ]

        for pattern in skip_patterns:
            if re.search(pattern, text_lower, re.I):
                return False

        # Must contain actual program/course keywords
        program_patterns = [
            r"\b(B\.?Sc|B\.?A|B\.?Eng|B\.?Tech|B\.?Ed|LL\.?B|MBBS|B\.?Pharm|B\.?Agric|B\.?Arch|B\.?Vet|ND|HND|NCE|OND)\b",
            r"\b(Computer Science|Engineering|Medicine|Law|Pharmacy|Agriculture|Architecture|Education)\b",
            r"\b(Accounting|Business|Economics|Mass Communication|Political Science|Sociology|Psychology)\b",
            r"\b(Mathematics|Physics|Chemistry|Biology|Geography|History|Literature|English)\b",
            r"\b(Mechanical|Electrical|Civil|Chemical|Petroleum|Aerospace)\s+Engineering\b",
            r"\b(Software|Information|Data)\s+(Engineering|Science|Technology)\b",
            r"\b(Public|International|Business)\s+(Administration|Relations)\b",
            r"\b(Environmental|Marine|Food)\s+(Science|Engineering|Technology)\b",
        ]

        # Must match at least one program pattern
        has_program_keyword = any(re.search(p, text, re.I) for p in program_patterns)
        
        # Also check if it's a standalone course name (not an announcement)
        is_standalone_course = (
            len(text.split()) <= 6 and  # Short enough to be a course name
            not re.search(r"\d{4}", text) and  # No years
            not text_lower.startswith("admission") and  # Not admission announcements
            not text_lower.startswith("screening") and  # Not exam announcements
            any(word in text_lower for word in ["science", "engineering", "technology", "management", "studies", "education", "medicine", "law", "arts"])
        )
        
        return has_program_keyword or is_standalone_course

    def _extract_program_info(
        self, program_text: str, institution_name: str, institution_id: str, source_url: str, soup: BeautifulSoup
    ) -> Optional[Dict]:
        """Extract program information from text and page context"""
        # Clean program name
        name = program_text.strip()
        
        # Extract degree type
        degree_type = self._extract_degree_type(name)

        # Extract UTME subjects (common patterns)
        utme_subjects = self._extract_utme_subjects(name, soup)

        # Extract O-level subjects
        olevel_subjects = self._extract_olevel_subjects(name, soup)

        # Extract duration
        duration = self._extract_duration(name, soup)

        # Extract description
        description = self._extract_description(name, soup)

        # Extract admission requirements
        admission_requirements = self._extract_admission_requirements(name, soup)

        program = {
            "name": name,
            "institution_name": institution_name,
            "institutionId": institution_id,
            "degreeType": degree_type,
            "utmeSubjects": utme_subjects,
            "olevelSubjects": olevel_subjects,
            "duration": duration,
            "description": description,
            "admissionRequirements": admission_requirements,
            "source_url": source_url,
            "license": "CC-BY-NC-SA",
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
        page_text = soup.get_text()
        subject_patterns = [
            r"UTME\s+subjects?[:\s]+([A-Za-z,\s]+)",
            r"JAMB\s+subjects?[:\s]+([A-Za-z,\s]+)",
            r"Required\s+subjects?[:\s]+([A-Za-z,\s]+)",
        ]

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


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    scraper = ProgramScraper()
    # Test with a sample URL
    test_url = "https://myschoolgist.com/ng/list-of-available-courses-in-adeleke-university/"
    programs = scraper.scrape_programs_from_url(test_url, "Adeleke University", "test-id")
    print(f"\nScraped {len(programs)} programs")
    if programs:
        print("\nSample program:")
        print(json.dumps(programs[0], indent=2))

