import logging
from typing import Iterable

from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError

from context_ingestion.config import (
    AUDIO_STREAM_TOPIC,
    CONTEXT_TOPIC,
    KAFKA_BOOTSTRAP_SERVERS,
    LOCATION_STREAM_TOPIC,
    LOG_LEVEL,
    VIDEO_STREAM_TOPIC,
)


logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


def ensure_topics(topic_names: Iterable[str]) -> None:
    topics = [topic for topic in dict.fromkeys(topic_names) if topic]
    if not topics:
        return

    admin = KafkaAdminClient(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        client_id="context-ingestion-topic-bootstrap",
    )
    try:
        existing_topics = set(admin.list_topics())
        missing_topics = [
            NewTopic(name=topic, num_partitions=1, replication_factor=1)
            for topic in topics
            if topic not in existing_topics
        ]
        if not missing_topics:
            logger.info("Kafka topics already exist topics=%s", topics)
            return

        try:
            admin.create_topics(new_topics=missing_topics, validate_only=False)
        except TopicAlreadyExistsError:
            pass

        logger.info(
            "Kafka topics ready topics=%s",
            [topic.name for topic in missing_topics],
        )
    finally:
        admin.close()


def ensure_context_ingestion_topics() -> None:
    ensure_topics(
        [
            VIDEO_STREAM_TOPIC,
            AUDIO_STREAM_TOPIC,
            LOCATION_STREAM_TOPIC,
            CONTEXT_TOPIC,
        ]
    )


def ensure_normalized_context_topic() -> None:
    ensure_topics([CONTEXT_TOPIC])


if __name__ == "__main__":
    ensure_context_ingestion_topics()
