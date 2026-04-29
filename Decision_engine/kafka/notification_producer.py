import json
from datetime import date, datetime
from typing import Any, Dict, Optional

from Decision_engine.config.settings import Settings, get_settings
from Decision_engine.models.decision import Action, Decision
from Decision_engine.pipeline.processor import NotificationProducerPort
from Decision_engine.utils.pydantic import model_to_dict


class NotificationProducer(NotificationProducerPort):
    def __init__(
        self,
        producer=None,
        topic: Optional[str] = None,
        settings: Optional[Settings] = None,
    ):
        self.settings = settings or get_settings()
        self.topic = topic or self.settings.kafka_actions_topic
        self.producer = producer or self._build_kafka_producer()

    def publish_action(self, decision: Decision, action: Action) -> None:
        if not self._is_publishable(action):
            return

        payload = self.build_payload(decision, action)
        self.producer.send(self.topic, payload)
        flush = getattr(self.producer, "flush", None)
        if callable(flush):
            flush()

    def build_payload(self, decision: Decision, action: Action) -> Dict[str, Any]:
        return {
            "decision_id": decision.decision_id,
            "user_id": decision.user_id,
            "context_id": decision.source_context_id,
            "action_type": action.type,
            "timestamp": self._to_json_value(decision.timestamp),
            "payload": self._to_json_value(action.payload),
        }

    def _is_publishable(self, action: Action) -> bool:
        if action.type == "notification":
            return True
        if action.type == "close_meeting" and action.payload.get("summary_required"):
            return True
        return False

    def _build_kafka_producer(self):
        try:
            from kafka import KafkaProducer
        except ImportError as exc:
            raise RuntimeError(
                "kafka-python is required for NotificationProducer. "
                "Install it with 'pip install kafka-python'."
            ) from exc

        return KafkaProducer(
            bootstrap_servers=self.settings.kafka_bootstrap_servers,
            value_serializer=lambda value: json.dumps(
                value,
                ensure_ascii=False,
                default=self._to_json_value,
            ).encode("utf-8"),
        )

    def _to_json_value(self, value: Any):
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, list):
            return [self._to_json_value(item) for item in value]
        if isinstance(value, dict):
            return {
                key: self._to_json_value(item)
                for key, item in value.items()
            }
        if hasattr(value, "model_dump") or hasattr(value, "dict"):
            return self._to_json_value(model_to_dict(value))
        return value
