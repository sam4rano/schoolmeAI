"""
Script to scrape approved schools of nursing from NMCN PDF and import to database
"""
import logging
import json
import sys
import requests
from typing import List, Dict
from scrapers.nmcn.scraper import NMCNScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def import_nursing_schools_to_db(schools: List[Dict], api_url: str = "http://localhost:3000"):
    """Import nursing schools to database via API"""
    endpoint = f"{api_url}/api/scrape/import"

    # Send in batches
    batch_size = 100
    total_created = 0
    total_updated = 0
    total_errors = []

    for i in range(0, len(schools), batch_size):
        batch = schools[i:i + batch_size]
        payload = {
            "institutions": batch,
            "source": "nmcn",
        }

        try:
            logger.info(f"Sending batch {i//batch_size + 1} ({len(batch)} schools)...")
            response = requests.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=300,
            )

            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", "Unknown error")
                    error_details = error_data.get("details", [])
                    logger.error(f"Batch {i//batch_size + 1} failed: {error_msg}")
                    if error_details:
                        # Log first few errors as examples
                        for detail in error_details[:5]:
                            logger.error(f"  - {detail.get('path', [])}: {detail.get('message', '')}")
                except:
                    error_data = response.text
                    logger.error(f"Batch {i//batch_size + 1} failed: {error_data[:500]}")
                total_errors.extend([f"Batch {i//batch_size + 1}: {str(error_data)}"])
                continue

            result = response.json()
            total_created += result.get("results", {}).get("created", 0)
            total_updated += result.get("results", {}).get("updated", 0)
            if result.get("results", {}).get("errors"):
                total_errors.extend(result["results"]["errors"])

        except Exception as e:
            logger.error(f"Error sending batch {i//batch_size + 1}: {e}")
            total_errors.extend([f"Batch {i//batch_size + 1}: {str(e)}"])

    logger.info(f"Import completed: Created {total_created}, Updated {total_updated}")
    if total_errors:
        logger.warning(f"Total errors: {len(total_errors)}")

    return {
        "success": True,
        "results": {
            "created": total_created,
            "updated": total_updated,
            "errors": total_errors,
        },
    }


def main():
    """Main function"""
    logger.info("Starting NMCN nursing schools scraping process...")

    api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

    # Scrape nursing schools
    scraper = NMCNScraper()
    schools = scraper.scrape_institutions()

    if not schools:
        logger.error("No nursing schools scraped!")
        sys.exit(1)

    logger.info(f"Scraped {len(schools)} approved schools of nursing")

    # Save to JSON file as backup
    output_file = "scraped_nmcn_nursing_schools.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(schools, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved scraped data to {output_file}")

    # Import to database
    try:
        logger.info(f"Importing to database via {api_url}...")
        result = import_nursing_schools_to_db(schools, api_url)
        logger.info("Import completed successfully!")
        logger.info(f"Created: {result['results']['created']}, Updated: {result['results']['updated']}")
    except Exception as e:
        logger.error(f"Import failed: {e}")
        logger.info(f"Data saved to {output_file} for manual import")
        sys.exit(1)


if __name__ == "__main__":
    main()

