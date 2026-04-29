import unittest
from datetime import datetime, timedelta, timezone

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.significance_detector import SignificanceResult
from Decision_engine.pipeline.state_manager import StateManager


class StateManagerTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.manager = StateManager()

    def _context(self, context_id="ctx_001", timestamp=None):
        return NormalizedContext(
            context_id=context_id,
            user_id="user_001",
            context_timestamp=timestamp or self.now,
            visual_description="User is working at a desk.",
            objects=["laptop", "desk"],
            audio_keywords=["decision engine"],
            location_label="home",
        )

    def _significance(self, should_call_llm=True):
        return SignificanceResult(
            should_call_llm=should_call_llm,
            reason="test",
        )

    def test_non_significant_event_updates_only_last_seen_at(self):
        state = UserState(
            user_id="user_001",
            current_activity="working",
            current_session_duration_minutes=45,
        )
        interpretation = LLMInterpretation(activity="break", is_break=True)

        updated = self.manager.update_state(
            state,
            self._context(),
            interpretation,
            self._significance(should_call_llm=False),
        )

        self.assertEqual(updated.last_seen_at, self.now)
        self.assertEqual(updated.current_activity, "working")
        self.assertEqual(updated.current_session_duration_minutes, 45)
        self.assertIsNone(updated.last_llm_interpretation_at)

    def test_significant_event_updates_activity_and_last_significant_context(self):
        state = UserState(user_id="user_001")
        interpretation = LLMInterpretation(
            activity="working",
            activity_label="desk work",
            confidence=0.8,
        )

        updated = self.manager.update_state(
            state,
            self._context(),
            interpretation,
            self._significance(),
        )

        self.assertEqual(updated.current_activity, "working")
        self.assertEqual(updated.activity_started_at, self.now)
        self.assertEqual(updated.last_activity_detected_at, self.now)
        self.assertEqual(updated.last_llm_interpretation_at, self.now)
        self.assertEqual(updated.last_significant_context_id, "ctx_001")
        self.assertEqual(updated.last_significant_audio_keywords, ["decision engine"])
        self.assertEqual(updated.last_work_detected_at, self.now)

    def test_same_activity_updates_session_duration(self):
        started_at = self.now - timedelta(minutes=75)
        state = UserState(
            user_id="user_001",
            current_activity="working",
            activity_started_at=started_at,
        )
        interpretation = LLMInterpretation(activity="working")

        updated = self.manager.update_state(
            state,
            self._context(),
            interpretation,
            self._significance(),
        )

        self.assertEqual(updated.activity_started_at, started_at)
        self.assertEqual(updated.current_session_duration_minutes, 75.0)

    def test_break_activity_updates_last_break_at(self):
        state = UserState(user_id="user_001", current_activity="working")
        interpretation = LLMInterpretation(activity="break", is_break=True)

        updated = self.manager.update_state(
            state,
            self._context(),
            interpretation,
            self._significance(),
        )

        self.assertEqual(updated.current_activity, "break")
        self.assertEqual(updated.last_break_at, self.now)


if __name__ == "__main__":
    unittest.main()
