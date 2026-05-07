import json
import logging
from typing import Any, Dict, Optional

from kafka import KafkaProducer

from context_ingestion.config import (
    CONTEXT_TOPIC,
    KAFKA_BOOTSTRAP_SERVERS,
)


logger = logging.getLogger(__name__)


class ContextProducer:
    def __init__(
        self,
        bootstrap_servers: Optional[str] = None,
        topic: Optional[str] = None,
        producer: Optional[KafkaProducer] = None,
    ):
        self.bootstrap_servers = bootstrap_servers or KAFKA_BOOTSTRAP_SERVERS
        self.topic = topic or CONTEXT_TOPIC
        self.producer = producer or KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda value: json.dumps(value).encode("utf-8"),
        )

    def publish(self, context_message: Dict[str, Any]) -> None:
        self.producer.send(self.topic, context_message)
        self.producer.flush()
        logger.info(
            "Context published to Kafka topic=%s payload=%s",
            self.topic,
            context_message,
        )

    def close(self) -> None:
        self.producer.close()
