import unittest
from datetime import datetime, timezone

from Decision_engine.kafka.notification_producer import NotificationProducer
from Decision_engine.models.decision import Action, Decision


class FakeKafkaProducer(object):
    def __init__(self):
        self.sent = []
        self.flush_count = 0

    def send(self, topic, payload):
        self.sent.append((topic, payload))

    def flush(self):
        self.flush_count += 1


class NotificationProducerTest(unittest.TestCase):
    def setUp(self):
        self.timestamp = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.decision = Decision(
            decision_id="dec_001",
            user_id="user_001",
            timestamp=self.timestamp,
            decision_type="notification",
            source_context_id="ctx_001",
        )
        self.fake = FakeKafkaProducer()
        self.producer = NotificationProducer(
            producer=self.fake,
            topic="decision.actions",
        )

    def test_publishes_notification_payload(self):
        action = Action(
            type="notification",
            target="notification_service",
            payload={
                "notification_type": "break_reminder",
                "message": "Take a short break.",
            },
        )

        self.producer.publish_action(self.decision, action)

        self.assertEqual(len(self.fake.sent), 1)
        topic, payload = self.fake.sent[0]
        self.assertEqual(topic, "decision.actions")
        self.assertEqual(payload["decision_id"], "dec_001")
        self.assertEqual(payload["user_id"], "user_001")
        self.assertEqual(payload["context_id"], "ctx_001")
        self.assertEqual(payload["action_type"], "notification")
        self.assertEqual(payload["timestamp"], "2026-04-25T15:00:00+00:00")
        self.assertEqual(payload["payload"]["message"], "Take a short break.")
        self.assertEqual(self.fake.flush_count, 1)

    def test_publishes_close_meeting_only_when_summary_required(self):
        action = Action(
            type="close_meeting",
            target="meeting_manager",
            payload={"meeting_id": "meet_001", "summary_required": True},
        )

        self.producer.publish_action(self.decision, action)

        self.assertEqual(len(self.fake.sent), 1)
        self.assertEqual(self.fake.sent[0][1]["action_type"], "close_meeting")

    def test_does_not_publish_append_meeting_transcript(self):
        action = Action(
            type="append_meeting_transcript",
            target="meeting_manager",
            payload={"meeting_id": "meet_001"},
        )

        self.producer.publish_action(self.decision, action)

        self.assertEqual(self.fake.sent, [])
        self.assertEqual(self.fake.flush_count, 0)

    def test_does_not_publish_close_meeting_without_summary(self):
        action = Action(
            type="close_meeting",
            target="meeting_manager",
            payload={"meeting_id": "meet_001", "summary_required": False},
        )

        self.producer.publish_action(self.decision, action)

        self.assertEqual(self.fake.sent, [])


if __name__ == "__main__":
    unittest.main()
