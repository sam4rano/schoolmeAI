"""
Script to scrape programs from institutions
Uses the courses_url from institutions to scrape their programs
"""
import logging
import json
import sys
import requests
from typing import List, Dict, Optional
from scrapers.myschoolgist.scrape_programs import ProgramScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_institutions_from_api(api_url: str = "http://localhost:3000") -> List[Dict]:
    """Get institutions from API that have courses_url"""
    try:
        response = requests.get(f"{api_url}/api/institutions?limit=1000")
        response.raise_for_status()
        data = response.json()
        institutions = data.get("data", [])
        
        # Filter institutions with courses_url
        institutions_with_courses = [
            inst for inst in institutions
            if inst.get("courses_url") or inst.get("website")
        ]
        
        logger.info(f"Found {len(institutions_with_courses)} institutions with course URLs")
        return institutions_with_courses
    except Exception as e:
        logger.error(f"Error fetching institutions: {e}")
        return []


def scrape_all_programs(api_url: str = "http://localhost:3000", limit_institutions: Optional[int] = None) -> List[Dict]:
    """Scrape programs from all institutions"""
    scraper = ProgramScraper()
    institutions = get_institutions_from_api(api_url)
    
    # Limit institutions if specified (useful for testing or prioritizing top institutions)
    if limit_institutions:
        institutions = institutions[:limit_institutions]
        logger.info(f"Limited to {limit_institutions} institutions")
    
    all_programs = []
    
    for institution in institutions:
        institution_id = institution.get("id")
        institution_name = institution.get("name")
        courses_url = institution.get("courses_url")
        website = institution.get("website")
        
        # Try courses_url first, then website
        url_to_use = courses_url or website
        
        if not url_to_use:
            continue
        
        try:
            logger.info(f"Scraping programs from {institution_name} ({url_to_use})")
            programs = scraper.scrape_programs_from_url(url_to_use, institution_name, institution_id)
            
            for program in programs:
                program["institutionId"] = institution_id
                program["institution_name"] = institution_name
            
            all_programs.extend(programs)
            logger.info(f"Scraped {len(programs)} programs from {institution_name}")
            
        except Exception as e:
            logger.error(f"Error scraping programs from {institution_name}: {e}")
            continue
    
    logger.info(f"Total programs scraped: {len(all_programs)}")
    return all_programs


def import_programs_to_db(programs: List[Dict], api_url: str = "http://localhost:3000"):
    """Import programs to database via API"""
    endpoint = f"{api_url}/api/scrape/programs"
    
    # Send in batches
    batch_size = 50
    total_created = 0
    total_updated = 0
    total_errors = []
    
    for i in range(0, len(programs), batch_size):
        batch = programs[i:i + batch_size]
        payload = {
            "programs": batch,
            "source": "myschoolgist",
        }
        
        try:
            logger.info(f"Sending batch {i//batch_size + 1} ({len(batch)} programs)...")
            response = requests.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=300,
            )
            
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', 'Unknown error')
                    error_details = error_data.get('details', [])
                    logger.error(f"Batch {i//batch_size + 1} failed: {error_msg}")
                    if error_details:
                        # Log first few errors as examples
                        for detail in error_details[:3]:
                            logger.error(f"  - {detail.get('path', [])}: {detail.get('message', '')}")
                except:
                    error_data = response.text
                    logger.error(f"Batch {i//batch_size + 1} failed: {error_data[:500]}")
                total_errors.extend([f"Batch {i//batch_size + 1}: {str(error_data)}"])
                continue
            
            result = response.json()
            total_created += result.get('results', {}).get('created', 0)
            total_updated += result.get('results', {}).get('updated', 0)
            if result.get('results', {}).get('errors'):
                total_errors.extend(result['results']['errors'])
        
        except Exception as e:
            logger.error(f"Error sending batch {i//batch_size + 1}: {e}")
            total_errors.extend([f"Batch {i//batch_size + 1}: {str(e)}"])
    
    logger.info(f"Import completed: Created {total_created}, Updated {total_updated}")
    if total_errors:
        logger.warning(f"Total errors: {len(total_errors)}")
    
    return {
        'success': True,
        'results': {
            'created': total_created,
            'updated': total_updated,
            'errors': total_errors
        }
    }


def main():
    """Main function"""
    logger.info("Starting program scraping process...")
    
    api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    
    # Scrape programs
    programs = scrape_all_programs(api_url)
    
    if not programs:
        logger.error("No programs scraped!")
        sys.exit(1)
    
    # Save to JSON file as backup
    output_file = "scraped_programs.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(programs, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved scraped data to {output_file}")
    
    # Import to database
    try:
        logger.info(f"Importing to database via {api_url}...")
        result = import_programs_to_db(programs, api_url)
        logger.info("Import completed successfully!")
        logger.info(f"Created: {result['results']['created']}, Updated: {result['results']['updated']}")
    except Exception as e:
        logger.error(f"Import failed: {e}")
        logger.info(f"Data saved to {output_file} for manual import")
        sys.exit(1)


if __name__ == "__main__":
    main()

