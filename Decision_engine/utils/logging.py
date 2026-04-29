import logging
import os


LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s - %(message)s"


def configure_logging(level_name: str = None) -> None:
    level_name = level_name or os.getenv("LOG_LEVEL", "INFO")
    level = getattr(logging, level_name.upper(), logging.INFO)
    logging.basicConfig(level=level, format=LOG_FORMAT, force=True)
