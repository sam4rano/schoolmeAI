"""
Script to enhance institutions with websites from multiple sources
"""
import logging
import json
import sys
import re
import requests
from typing import Dict, List
from scrapers.nuc.website_scraper import NUCWebsiteScraper

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


def match_institution_name(name1: str, name2: str) -> bool:
    """Check if two institution names match"""
    # Normalize names
    def normalize(n: str) -> str:
        n = n.lower().strip()
        # Remove common words
        n = re.sub(r"\b(the|a|university|polytechnic|college|institute|school)\b", "", n, flags=re.I)
        # Remove punctuation
        n = re.sub(r"[^\w\s]", "", n)
        # Remove extra whitespace
        n = " ".join(n.split())
        return n
    
    import re
    norm1 = normalize(name1)
    norm2 = normalize(name2)
    
    # Check for exact match
    if norm1 == norm2:
        return True
    
    # Check if one contains the other (for partial matches)
    if norm1 in norm2 or norm2 in norm1:
        return True
    
    # Check for word overlap (at least 3 words match)
    words1 = set(norm1.split())
    words2 = set(norm2.split())
    common_words = words1.intersection(words2)
    if len(common_words) >= 3:
        return True
    
    return False


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
    
    # Combine all websites
    all_websites = {**nuc_websites, **other_websites}
    logger.info(f"Total websites found: {len(all_websites)}")
    
    # Match institutions with websites
    matches = []
    for institution in institutions:
        inst_name = institution.get("name", "")
        current_website = institution.get("website")
        
        # Skip if already has website
        if current_website:
            continue
        
        # Try to find matching website
        for website_name, website_url in all_websites.items():
            if match_institution_name(inst_name, website_name):
                matches.append({
                    "institution_id": institution.get("id"),
                    "institution_name": inst_name,
                    "website": website_url,
                    "matched_name": website_name,
                })
                logger.info(f"Matched {inst_name} with {website_url} (matched: {website_name})")
                break
    
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

