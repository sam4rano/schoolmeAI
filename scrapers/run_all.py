"""
Run all scrapers
"""
import logging
import sys
from datetime import datetime
from scrapers.nuc.scraper import NUCScraper
from scrapers.myschool.scraper import MySchoolScraper
from scrapers.myschoolgist.scraper import MySchoolGistScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    """Run all scrapers"""
    logger.info("Starting scraper run...")
    start_time = datetime.now()

    results = {
        "nuc": {"institutions": 0, "programs": 0, "cutoffs": 0},
        "myschool": {"institutions": 0, "programs": 0, "cutoffs": 0},
        "myschoolgist": {"institutions": 0, "programs": 0, "cutoffs": 0},
    }

    try:
        # Run NUC scraper
        logger.info("Running NUC scraper...")
        nuc_scraper = NUCScraper()
        nuc_institutions = nuc_scraper.scrape_institutions()
        results["nuc"]["institutions"] = len(nuc_institutions)

        # Run Myschool scraper
        logger.info("Running Myschool scraper...")
        myschool_scraper = MySchoolScraper()
        myschool_institutions = myschool_scraper.scrape_institutions()
        results["myschool"]["institutions"] = len(myschool_institutions)

        # Run MySchoolGist scraper
        logger.info("Running MySchoolGist scraper...")
        myschoolgist_scraper = MySchoolGistScraper()
        myschoolgist_institutions = myschoolgist_scraper.scrape_institutions()
        results["myschoolgist"]["institutions"] = len(myschoolgist_institutions)

    except Exception as e:
        logger.error(f"Error running scrapers: {e}", exc_info=True)
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info("=" * 50)
    logger.info("Scraper Run Summary")
    logger.info("=" * 50)
    for source, stats in results.items():
        logger.info(f"{source.upper()}:")
        logger.info(f"  Institutions: {stats['institutions']}")
        logger.info(f"  Programs: {stats['programs']}")
        logger.info(f"  Cutoffs: {stats['cutoffs']}")
    logger.info(f"Total duration: {duration:.2f} seconds")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()


