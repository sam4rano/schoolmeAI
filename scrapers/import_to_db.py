"""
Import scraped data to database via API
"""
import json
import logging
import requests
import sys
import os
from typing import List, Dict

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.myschoolgist.scraper import MySchoolGistScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def clean_for_json(obj):
    """Recursively clean data to ensure JSON serializability"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif hasattr(obj, '__dict__'):
        # Handle objects with __dict__ (like BeautifulSoup Tags)
        return str(obj)
    elif hasattr(obj, 'get_text'):
        # BeautifulSoup Tag
        return str(obj.get_text(strip=True))
    elif hasattr(obj, 'get'):
        # BeautifulSoup Tag attributes
        return str(obj)
    else:
        return obj


def import_to_database(institutions: List[Dict], api_url: str = "http://localhost:3000"):
    """Import institutions to database via API"""
    endpoint = f"{api_url}/api/scrape/import"

    payload = {
        "institutions": institutions,
        "source": "myschoolgist",
    }

    try:
        # Send in batches to avoid timeout
        batch_size = 100
        total_created = 0
        total_updated = 0
        total_errors = []
        
        for i in range(0, len(institutions), batch_size):
            batch = institutions[i:i + batch_size]
            batch_payload = {
                "institutions": batch,
                "source": payload["source"],
            }
            
            logger.info(f"Sending batch {i//batch_size + 1} ({len(batch)} institutions)...")
            response = requests.post(
                endpoint,
                json=batch_payload,
                headers={"Content-Type": "application/json"},
                timeout=300,  # 5 minutes timeout
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                logger.error(f"Batch {i//batch_size + 1} failed: {error_data}")
                total_errors.extend([f"Batch {i//batch_size + 1}: {str(error_data)}"])
                continue
            
            result = response.json()
            total_created += result.get('results', {}).get('created', 0)
            total_updated += result.get('results', {}).get('updated', 0)
            if result.get('results', {}).get('errors'):
                total_errors.extend(result['results']['errors'])
        
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
        result = response.json()
        logger.info(f"Import successful: {result.get('message', '')}")
        logger.info(f"Created: {result.get('results', {}).get('created', 0)}")
        logger.info(f"Updated: {result.get('results', {}).get('updated', 0)}")
        if result.get("results", {}).get("errors"):
            logger.warning(f"Errors: {len(result['results']['errors'])}")
        return result
    except requests.RequestException as e:
        logger.error(f"Error importing to database: {e}")
        if hasattr(e, "response") and e.response:
            try:
                error_data = e.response.json()
                logger.error(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                logger.error(f"Response text: {e.response.text}")
        raise


def main():
    """Main function"""
    logger.info("Starting scraper and import process...")

    # Scrape institutions
    scraper = MySchoolGistScraper()
    institutions = scraper.scrape_institutions()

    if not institutions:
        logger.error("No institutions scraped!")
        sys.exit(1)

    logger.info(f"Scraped {len(institutions)} institutions")

    # Clean data for JSON serialization
    logger.info("Cleaning data for JSON serialization...")
    cleaned_institutions = [clean_for_json(inst) for inst in institutions]
    
    # Save to JSON file as backup
    output_file = "scraped_institutions.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cleaned_institutions, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved scraped data to {output_file}")

    # Import to database
    try:
        api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
        logger.info(f"Importing to database via {api_url}...")
        import_to_database(cleaned_institutions, api_url)
        logger.info("Import completed successfully!")
    except Exception as e:
        logger.error(f"Import failed: {e}")
        logger.info(f"Data saved to {output_file} for manual import")
        sys.exit(1)


if __name__ == "__main__":
    main()

