"""
Script to enhance institutions with websites from multiple sources
"""
import logging
import json
import sys
import re
import requests
from typing import Dict, List, Tuple
from scrapers.nuc.website_scraper import NUCWebsiteScraper
from scrapers.alternative_website_scraper import AlternativeWebsiteScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_institutions_from_api(api_url: str = "http://localhost:3000") -> List[Dict]:
    """Get all institutions from API"""
    try:
        response = requests.get(f"{api_url}/api/institutions?limit=10000")
        response.raise_for_status()
        data = response.json()
        institutions = data.get("data", [])
        logger.info(f"Found {len(institutions)} institutions")
        return institutions
    except Exception as e:
        logger.error(f"Error fetching institutions: {e}")
        return []


def normalize_institution_name(name: str) -> str:
    """Normalize institution name for matching"""
    if not name:
        return ""
    
    n = name.lower().strip()
    # Remove common words
    n = re.sub(r"\b(the|a|university|polytechnic|college|institute|school|of|and|in|nigeria|nigerian)\b", "", n, flags=re.I)
    # Remove punctuation
    n = re.sub(r"[^\w\s]", "", n)
    # Remove extra whitespace
    n = " ".join(n.split())
    return n


def calculate_similarity(name1: str, name2: str) -> float:
    """Calculate similarity score between two institution names (0-100)"""
    norm1 = normalize_institution_name(name1)
    norm2 = normalize_institution_name(name2)
    
    if not norm1 or not norm2:
        return 0.0
    
    # Exact match
    if norm1 == norm2:
        return 100.0
    
    # Check if one contains the other (high similarity)
    if norm1 in norm2 or norm2 in norm1:
        return 90.0
    
    # Word overlap score
    words1 = set(norm1.split())
    words2 = set(norm2.split())
    
    if not words1 or not words2:
        return 0.0
    
    common_words = words1.intersection(words2)
    total_words = len(words1.union(words2))
    
    if total_words == 0:
        return 0.0
    
    # Jaccard similarity
    jaccard = len(common_words) / total_words
    
    # Weight by number of common words
    word_overlap_score = (len(common_words) / max(len(words1), len(words2))) * 100
    
    # Combine scores
    similarity = (jaccard * 50) + (word_overlap_score * 0.5)
    
    # Bonus for having at least 3 common words
    if len(common_words) >= 3:
        similarity = min(100.0, similarity + 20.0)
    
    return min(100.0, similarity)


def match_institution_name(name1: str, name2: str, min_similarity: float = 70.0) -> Tuple[bool, float]:
    """Check if two institution names match with confidence score
    Returns: (is_match, confidence_score)
    """
    similarity = calculate_similarity(name1, name2)
    is_match = similarity >= min_similarity
    return (is_match, similarity)


def enhance_institutions_with_websites(api_url: str = "http://localhost:3000"):
    """Enhance institutions with websites from NUC and other sources"""
    logger.info("Starting website enhancement process...")
    
    # Get institutions
    institutions = get_institutions_from_api(api_url)
    if not institutions:
        logger.error("No institutions found!")
        return
    
    # Scrape websites from NUC
    logger.info("Scraping websites from NUC...")
    nuc_scraper = NUCWebsiteScraper()
    nuc_websites = nuc_scraper.scrape_institution_websites()
    
    # Scrape from other sources
    logger.info("Scraping websites from other sources...")
    other_websites = nuc_scraper.scrape_from_other_sources()
    
    # Use alternative scraper for institutions without websites
    logger.info("Using alternative sources for missing websites...")
    alternative_scraper = AlternativeWebsiteScraper()
    
    # Get institutions without websites
    institutions_without_websites = [
        inst for inst in institutions
        if not inst.get("website")
    ]
    
    # Find websites using alternative methods
    alternative_websites = {}
    if institutions_without_websites:
        logger.info(f"Searching for {len(institutions_without_websites)} institutions without websites...")
        # Limit to first 50 to avoid rate limits (can be adjusted)
        limited_institutions = institutions_without_websites[:50]
        alternative_websites = alternative_scraper.find_websites_batch(limited_institutions)
        logger.info(f"Found {len(alternative_websites)} websites via alternative sources")
    
    # Combine all websites
    all_websites = {**nuc_websites, **other_websites, **alternative_websites}
    logger.info(f"Total websites found: {len(all_websites)}")
    
    # Match institutions with websites
    matches = []
    for institution in institutions:
        inst_name = institution.get("name", "")
        current_website = institution.get("website")
        
        # Skip if already has website
        if current_website:
            continue
        
        # Try to find matching website with best confidence score
        best_match = None
        best_confidence = 0.0
        
        for website_name, website_url in all_websites.items():
            is_match, confidence = match_institution_name(inst_name, website_name, min_similarity=60.0)
            if is_match and confidence > best_confidence:
                best_match = {
                    "institution_id": institution.get("id"),
                    "institution_name": inst_name,
                    "website": website_url,
                    "matched_name": website_name,
                    "confidence": round(confidence, 2),
                }
                best_confidence = confidence
        
        if best_match:
            matches.append(best_match)
            logger.info(f"Matched {inst_name} with {best_match['website']} (confidence: {best_match['confidence']}%)")
    
    logger.info(f"Found {len(matches)} website matches")
    
    # Update institutions via API
    if matches:
        logger.info("Updating institutions with websites...")
        update_institutions(matches, api_url)
    
    # Save matches to file
    output_file = "website_matches.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved matches to {output_file}")


def update_institutions(matches: List[Dict], api_url: str = "http://localhost:3000"):
    """Update institutions with websites via API"""
    endpoint = f"{api_url}/api/institutions"
    
    updated_count = 0
    failed_count = 0
    
    for match in matches:
        institution_id = match["institution_id"]
        website = match["website"]
        
        try:
            # Update with website using PATCH
            update_data = {
                "website": website,
            }
            
            response = requests.patch(
                f"{endpoint}/{institution_id}",
                json=update_data,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )
            
            if response.status_code == 200:
                updated_count += 1
                logger.info(f"✓ Updated {match['institution_name']} with website {website}")
            else:
                failed_count += 1
                logger.warning(f"✗ Failed to update {match['institution_name']}: {response.status_code} - {response.text}")
        
        except Exception as e:
            failed_count += 1
            logger.error(f"✗ Error updating {match['institution_name']}: {e}")
    
    logger.info(f"\nUpdate summary: {updated_count} updated, {failed_count} failed")


def main():
    """Main function"""
    api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    enhance_institutions_with_websites(api_url)


if __name__ == "__main__":
    main()

