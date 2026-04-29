import unittest
from datetime import datetime, timedelta, timezone

from Decision_engine.llm.base import LLMClient
from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.meeting import Meeting
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.processor import EventProcessor


class FakeStorage(object):
    def __init__(self, calls):
        self.calls = calls
        self.user_state = None
        self.last_significant_context = None
        self.active_meeting = None
        self.saved_decisions = []
        self.saved_decision_history_documents = []
        self.saved_notifications = []
        self.saved_meetings = []
        self.saved_normalized_contexts = []
        self.saved_states = []
        self.invalid_errors = []

    def save_raw_context_event(self, payload, status):
        self.calls.append("save_raw_context_event")
        return "raw_001"

    def mark_raw_context_event_invalid(self, raw_event_ref, errors):
        self.calls.append("mark_raw_context_event_invalid")
        self.invalid_errors = list(errors)

    def save_normalized_context(self, context):
        self.calls.append("save_normalized_context")
        self.saved_normalized_contexts.append(context)

    def get_user_state(self, user_id):
        self.calls.append("get_user_state")
        return self.user_state

    def save_user_state(self, state):
        self.calls.append("save_user_state")
        self.saved_states.append(state)
        self.user_state = state

    def get_last_significant_context(self, user_id):
        self.calls.append("get_last_significant_context")
        return self.last_significant_context

    def get_active_meeting(self, user_id, meeting_id):
        self.calls.append("get_active_meeting")
        return self.active_meeting

    def save_decision_history(self, history_document):
        self.calls.append("save_decision_history")
        self.saved_decision_history_documents.append(history_document)
        self.saved_decisions.append(history_document["decision"])

    def save_notification(self, decision, action):
        self.calls.append("save_notification")
        self.saved_notifications.append((decision, action))

    def save_activity_update(self, decision, action):
        self.calls.append("save_activity_update")

    def save_meeting(self, meeting):
        self.calls.append("save_meeting")
        self.saved_meetings.append(meeting)


class FakeLLMClient(LLMClient):
    def __init__(self, calls, interpretation=None, should_raise=False):
        super(FakeLLMClient, self).__init__(retry_count=2)
        self.calls = calls
        self.interpretation = interpretation or LLMInterpretation(
            activity="working",
            confidence=0.8,
            summary="The user is working on the decision engine.",
            memory_worthy=True,
        )
        self.should_raise = should_raise

    def interpret_context(self, normalized_context, user_state, last_significant_context=None):
        self.calls.append("interpret_context")
        if self.should_raise:
            raise RuntimeError("provider unavailable")
        return self.interpretation


class FakeVectorStore(object):
    def __init__(self, calls):
        self.calls = calls
        self.indexed = []

    def index_memory(self, text, metadata):
        self.calls.append("index_memory")
        self.indexed.append((text, metadata))


class FakeNotificationProducer(object):
    def __init__(self, calls):
        self.calls = calls
        self.published = []

    def publish_action(self, decision, action):
        self.calls.append("publish_action")
        self.published.append((decision, action))


class FakeRuleEngine(object):
    def __init__(self, calls, results=None):
        self.calls = calls
        self.results = results if results is not None else []

    def evaluate(self, context, interpretation, state):
        self.calls.append("rule_engine_evaluate")
        return self.results


class ProcessorTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.payload = {
            "context_id": "ctx_001",
            "user_id": "user_001",
            "created_at": self.now.isoformat(),
            "vision": {
                "timestamp": self.now.isoformat(),
                "objects": ["Laptop", "Desk"],
                "scene_description": "User is working at a desk.",
                "confidence": 0.8,
            },
            "audio": {
                "timestamp": self.now.isoformat(),
                "transcript": "We need to finish the decision engine.",
                "keywords": ["decision engine"],
                "confidence": 0.7,
            },
            "location": {
                "timestamp": self.now.isoformat(),
                "place_label": "home",
                "zone_type": "home",
            },
        }

    def _processor(self, storage, llm=None, vector_store=None, producer=None, rule_engine=None):
        calls = storage.calls
        return EventProcessor(
            storage=storage,
            llm_client=llm or FakeLLMClient(calls),
            vector_store=vector_store or FakeVectorStore(calls),
            notification_producer=producer or FakeNotificationProducer(calls),
            rule_engine=rule_engine or FakeRuleEngine(calls),
        )

    def _normalized_context(self):
        return NormalizedContext(
            context_id="ctx_000",
            user_id="user_001",
            context_timestamp=self.now - timedelta(minutes=1),
            visual_description="User is working at a desk.",
            objects=["laptop", "desk"],
            audio_transcript="We need to finish the decision engine.",
            audio_keywords=["decision engine"],
            location_label="home",
            zone_type="home",
        )

    def test_invalid_event_stops_after_raw_error_status(self):
        calls = []
        storage = FakeStorage(calls)
        processor = self._processor(storage)

        result = processor.process_event({"context_id": "ctx_bad"})

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.context_id, "ctx_bad")
        self.assertFalse(result.significant)
        self.assertIn("user_id is required", result.error)
        self.assertEqual(
            calls,
            ["save_raw_context_event", "mark_raw_context_event_invalid"],
        )

    def test_non_significant_event_updates_last_seen_and_stops(self):
        calls = []
        storage = FakeStorage(calls)
        storage.user_state = UserState(
            user_id="user_001",
            last_llm_interpretation_at=self.now - timedelta(minutes=1),
        )
        storage.last_significant_context = self._normalized_context()
        processor = self._processor(storage)

        result = processor.process_event(self.payload)

        self.assertEqual(result.status, "not_significant")
        self.assertFalse(result.significant)
        self.assertEqual(storage.saved_states[-1].last_seen_at, self.now)
        self.assertNotIn("interpret_context", calls)
        self.assertNotIn("save_decision_history", calls)
        self.assertEqual(
            calls,
            [
                "save_raw_context_event",
                "save_normalized_context",
                "get_user_state",
                "get_last_significant_context",
                "save_user_state",
            ],
        )

    def test_significant_event_runs_full_notification_pipeline(self):
        calls = []
        storage = FakeStorage(calls)
        rule_engine = FakeRuleEngine(
            calls,
            results=[
                RuleResult(
                    rule_name="break_reminder_rule",
                    triggered=True,
                    action_type="send_notification",
                    reason="Break reminder is due.",
                    payload={
                        "notification_type": "break_reminder",
                        "message": "Take a short break.",
                    },
                )
            ],
        )
        vector_store = FakeVectorStore(calls)
        producer = FakeNotificationProducer(calls)
        processor = self._processor(
            storage,
            vector_store=vector_store,
            producer=producer,
            rule_engine=rule_engine,
        )

        result = processor.process_event(self.payload)

        self.assertEqual(result.status, "processed")
        self.assertTrue(result.significant)
        self.assertIsNotNone(result.decision_id)
        self.assertEqual(storage.saved_decisions[-1]["decision_type"], "notification")
        self.assertIn("significance_result", storage.saved_decision_history_documents[-1])
        self.assertIn("llm_interpretation", storage.saved_decision_history_documents[-1])
        self.assertIn("state_snapshot", storage.saved_decision_history_documents[-1])
        self.assertIn("rule_results", storage.saved_decision_history_documents[-1])
        self.assertEqual(len(storage.saved_notifications), 1)
        self.assertEqual(len(producer.published), 1)
        self.assertEqual(len(vector_store.indexed), 1)
        self.assertEqual(
            calls,
            [
                "save_raw_context_event",
                "save_normalized_context",
                "get_user_state",
                "get_last_significant_context",
                "interpret_context",
                "get_active_meeting",
                "rule_engine_evaluate",
                "save_user_state",
                "save_decision_history",
                "save_notification",
                "publish_action",
                "index_memory",
            ],
        )

    def test_llm_failure_uses_unknown_fallback_and_continues(self):
        calls = []
        storage = FakeStorage(calls)
        llm = FakeLLMClient(calls, should_raise=True)
        vector_store = FakeVectorStore(calls)
        processor = self._processor(storage, llm=llm, vector_store=vector_store)

        result = processor.process_event(self.payload)

        self.assertEqual(result.status, "processed")
        decision = storage.saved_decisions[-1]
        self.assertEqual(decision["activity"], "unknown")
        self.assertEqual(decision["decision_type"], "no_action")
        self.assertEqual(vector_store.indexed, [])
        self.assertIn("interpret_context", calls)

    def test_meeting_action_is_saved_and_published(self):
        calls = []
        storage = FakeStorage(calls)
        llm = FakeLLMClient(
            calls,
            interpretation=LLMInterpretation(
                activity="meeting",
                confidence=0.85,
                meeting_detected=True,
                summary="A technical meeting about the MVP is happening.",
                memory_worthy=False,
            ),
        )
        processor = self._processor(storage, llm=llm)

        result = processor.process_event(self.payload)

        self.assertEqual(result.status, "processed")
        decision = storage.saved_decisions[-1]
        self.assertEqual(decision["decision_type"], "meeting_update")
        self.assertEqual(decision["actions"][0]["type"], "start_meeting")
        self.assertEqual(len(storage.saved_meetings), 1)
        self.assertIn("save_meeting", calls)
        self.assertNotIn("publish_action", calls)

    def test_close_meeting_with_summary_required_is_published(self):
        calls = []
        storage = FakeStorage(calls)
        storage.user_state = UserState(
            user_id="user_001",
            in_meeting=True,
            active_meeting_id="meet_001",
        )
        storage.active_meeting = Meeting(
            meeting_id="meet_001",
            user_id="user_001",
            started_at=self.now - timedelta(minutes=10),
        )
        llm = FakeLLMClient(
            calls,
            interpretation=LLMInterpretation(
                activity="working",
                confidence=0.7,
                meeting_detected=False,
                summary="The meeting appears to have ended.",
            ),
        )
        producer = FakeNotificationProducer(calls)
        processor = self._processor(storage, llm=llm, producer=producer)

        result = processor.process_event(self.payload)

        self.assertEqual(result.status, "processed")
        self.assertEqual(len(producer.published), 1)
        self.assertEqual(producer.published[0][1].type, "close_meeting")


if __name__ == "__main__":
    unittest.main()
