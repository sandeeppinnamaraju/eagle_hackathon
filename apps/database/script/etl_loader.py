"""Legacy compatibility wrapper for the ETL loader."""

from eagle_hackathon.apps.db.scripts.etl_loader import *  # noqa: F401,F403
from eagle_hackathon.apps.db.scripts.etl_loader import main


if __name__ == "__main__":
	main()