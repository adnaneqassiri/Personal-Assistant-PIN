import logging
from datetime import datetime, timezone

from context_ingestion.config import CONTEXT_TOPIC, LOG_LEVEL


logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


def build_sample_context():
    timestamp = (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "")
    )

    context_suffix = timestamp.replace("-", "").replace(":", "").replace("T", "_")

    scene_description = (
        "User is monitoring Moroccan political news articles from Hespress "
        "on multiple browser tabs while running a web scraping pipeline."
    )

    audio_transcript = (
        "We need to collect all politics articles, related links, tags, "
        "and comments for the misinformation detection project."
    )

    location = {
        "latitude": 35.7595,
        "longitude": -5.8340,
        "label": "research_lab",
        "place_label": "ENSA Tetouan AI Lab",
        "zone_type": "research",
    }

    return {
        "context_id": "ctx_hespress_web_mining_%s" % context_suffix,
        "user_id": "user_001",
        "created_at": timestamp,
        "timestamp": timestamp,
        "scene_description": scene_description,
        "audio_transcript": audio_transcript,
        "location": location,
        "source": "context_ingestion",
        "vision": {
            "timestamp": timestamp,
            "objects": [
                "laptop",
                "monitor",
                "browser",
                "news_articles",
                "terminal",
            ],
            "scene_description": scene_description,
            "confidence": 0.94,
            "media_ref": "hespress_scraping_session.jpg",
        },
        "audio": {
            "timestamp": timestamp,
            "transcript": audio_transcript,
            "keywords": [
                "hespress",
                "politics",
                "scraping",
                "osint",
                "misinformation",
                "web mining",
            ],
            "confidence": 0.91,
            "audio_ref": "research_meeting.wav",
        },
    }


def main() -> None:
    from context_ingestion.kafka.context_producer import ContextProducer
    from context_ingestion.kafka.topics import ensure_normalized_context_topic

    ensure_normalized_context_topic()

    message = build_sample_context()

    producer = ContextProducer(topic=CONTEXT_TOPIC)

    try:
        logger.info("Publishing sample context payload=%s", message)
        producer.publish(message)
    finally:
        producer.close()


if __name__ == "__main__":
    main()
