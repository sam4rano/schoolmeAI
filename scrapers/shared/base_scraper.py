"""
Base scraper class for all scrapers
"""
import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from datetime import datetime
import requests
from urllib.robotparser import RobotFileParser

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Base class for all scrapers"""

    def __init__(
        self,
        base_url: str,
        rate_limit_delay: float = 1.0,
        respect_robots: bool = True,
    ):
        self.base_url = base_url
        self.rate_limit_delay = rate_limit_delay
        self.respect_robots = respect_robots
        self.robots_parser = None
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "EduRepo-NG-AI/1.0 (Educational Research)",
        })

        if self.respect_robots:
            self._load_robots_txt()

    def _load_robots_txt(self):
        """Load and parse robots.txt"""
        try:
            robots_url = f"{self.base_url}/robots.txt"
            self.robots_parser = RobotFileParser()
            self.robots_parser.set_url(robots_url)
            self.robots_parser.read()
            logger.info(f"Loaded robots.txt from {robots_url}")
        except Exception as e:
            logger.warning(f"Could not load robots.txt: {e}")
            self.robots_parser = None

    def can_fetch(self, url: str) -> bool:
        """Check if URL can be fetched according to robots.txt"""
        if not self.respect_robots or not self.robots_parser:
            return True
        return self.robots_parser.can_fetch(self.session.headers["User-Agent"], url)

    def fetch(self, url: str, **kwargs) -> Optional[requests.Response]:
        """Fetch a URL with rate limiting and robots.txt checking"""
        if not self.can_fetch(url):
            logger.warning(f"Blocked by robots.txt: {url}")
            return None

        try:
            time.sleep(self.rate_limit_delay)
            response = self.session.get(url, timeout=30, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    @abstractmethod
    def scrape_institutions(self) -> List[Dict]:
        """Scrape institutions - must be implemented by subclasses"""
        pass

    @abstractmethod
    def scrape_programs(self, institution_id: Optional[str] = None) -> List[Dict]:
        """Scrape programs - must be implemented by subclasses"""
        pass

    @abstractmethod
    def scrape_cutoffs(self, program_id: Optional[str] = None) -> List[Dict]:
        """Scrape cutoff history - must be implemented by subclasses"""
        pass

    def normalize_institution(self, raw_data: Dict) -> Dict:
        """Normalize institution data to canonical format"""
        return {
            "name": raw_data.get("name", "").strip(),
            "type": self._normalize_type(raw_data.get("type", "")),
            "ownership": self._normalize_ownership(raw_data.get("ownership", "")),
            "state": raw_data.get("state", "").strip(),
            "city": raw_data.get("city", "").strip(),
            "website": raw_data.get("website", "").strip(),
            "contact": {
                "email": raw_data.get("email", ""),
                "phone": raw_data.get("phone", ""),
            },
            "accreditationStatus": raw_data.get("accreditation_status", ""),
            "provenance": {
                "source_url": raw_data.get("source_url", ""),
                "fetched_at": datetime.utcnow().isoformat(),
                "license": raw_data.get("license", "Unknown"),
            },
            "lastVerifiedAt": datetime.utcnow(),
            "dataQualityScore": self._calculate_quality_score(raw_data),
            "missingFields": self._identify_missing_fields(raw_data),
        }

    def _normalize_type(self, type_str: str) -> str:
        """Normalize institution type"""
        type_lower = type_str.lower()
        if "university" in type_lower:
            return "university"
        elif "polytechnic" in type_lower:
            return "polytechnic"
        elif "college" in type_lower:
            return "college"
        elif "nursing" in type_lower:
            return "nursing"
        elif "military" in type_lower:
            return "military"
        return "university"  # Default

    def _normalize_ownership(self, ownership_str: str) -> str:
        """Normalize ownership type"""
        ownership_lower = ownership_str.lower()
        if "federal" in ownership_lower:
            return "federal"
        elif "state" in ownership_lower:
            return "state"
        elif "private" in ownership_lower:
            return "private"
        return "federal"  # Default

    def _calculate_quality_score(self, data: Dict) -> int:
        """Calculate data quality score (0-100)"""
        score = 0
        required_fields = ["name", "type", "ownership", "state", "city"]
        optional_fields = ["website", "email", "phone", "accreditation_status"]

        for field in required_fields:
            if data.get(field):
                score += 15  # 15 points per required field

        for field in optional_fields:
            if data.get(field):
                score += 5  # 5 points per optional field

        return min(100, score)

    def _identify_missing_fields(self, data: Dict) -> List[str]:
        """Identify missing fields"""
        required_fields = ["name", "type", "ownership", "state", "city"]
        optional_fields = ["website", "email", "phone", "accreditation_status"]
        missing = []

        for field in required_fields + optional_fields:
            if not data.get(field):
                missing.append(field)

        return missing

    def save_to_raw_store(self, data: Dict, source: str) -> bool:
        """Save raw scraped data to object storage (S3)"""
        # TODO: Implement S3 upload
        logger.info(f"Saving {len(data)} items from {source} to raw store")
        return True

    def send_to_api(self, endpoint: str, data: Dict) -> bool:
        """Send normalized data to Next.js API"""
        # TODO: Implement API call to Next.js backend
        logger.info(f"Sending data to {endpoint}")
        return True


