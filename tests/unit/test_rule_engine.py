import unittest
from datetime import datetime, timedelta, timezone

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.rule_engine import RuleEngine
from Decision_engine.rules.base import Rule


class AlwaysNotifyRule(Rule):
    rule_name = "always_notify_rule"

    def __init__(self, notification_type="break_reminder"):
        self.notification_type = notification_type

    def evaluate(self, context, interpretation, state):
        return RuleResult(
            rule_name=self.rule_name,
            triggered=True,
            priority="low",
            action_type="send_notification",
            reason="test notification",
            payload={
                "notification_type": self.notification_type,
                "message": "test",
            },
        )


class RuleEngineTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.context = NormalizedContext(
            context_id="ctx_001",
            user_id="user_001",
            context_timestamp=self.now,
        )

    def _result_by_rule(self, results, rule_name):
        for result in results:
            if result.rule_name == rule_name:
                return result
        self.fail("Rule result not found: %s" % rule_name)

    def test_break_reminder_triggers_for_long_work_session(self):
        state = UserState(
            user_id="user_001",
            current_activity="working",
            current_session_duration_minutes=61,
            last_break_reminder_at=self.now - timedelta(minutes=31),
            last_hydration_reminder_at=self.now - timedelta(minutes=120),
        )
        interpretation = LLMInterpretation(activity="working", is_break=False)
        engine = RuleEngine()

        results = engine.evaluate(self.context, interpretation, state)

        break_result = self._result_by_rule(results, "break_reminder_rule")
        self.assertTrue(break_result.triggered)
        self.assertEqual(break_result.action_type, "send_notification")
        self.assertEqual(break_result.payload["notification_type"], "break_reminder")

    def test_hydration_reminder_triggers_for_long_active_session(self):
        state = UserState(
            user_id="user_001",
            current_activity="working",
            current_session_duration_minutes=91,
            last_break_reminder_at=self.now - timedelta(minutes=40),
            last_hydration_reminder_at=self.now - timedelta(minutes=91),
        )
        interpretation = LLMInterpretation(activity="working", is_break=False)
        engine = RuleEngine()

        results = engine.evaluate(self.context, interpretation, state)

        hydration_result = self._result_by_rule(results, "hydration_reminder_rule")
        self.assertTrue(hydration_result.triggered)
        self.assertEqual(hydration_result.action_type, "send_notification")
        self.assertEqual(
            hydration_result.payload["notification_type"],
            "hydration_reminder",
        )

    def test_meeting_rule_starts_meeting_when_detected(self):
        state = UserState(user_id="user_001", in_meeting=False)
        interpretation = LLMInterpretation(activity="meeting", meeting_detected=True)
        engine = RuleEngine()

        results = engine.evaluate(self.context, interpretation, state)

        meeting_result = self._result_by_rule(results, "meeting_rule")
        self.assertTrue(meeting_result.triggered)
        self.assertEqual(meeting_result.action_type, "start_meeting")

    def test_meeting_rule_closes_meeting_when_no_longer_detected(self):
        state = UserState(
            user_id="user_001",
            in_meeting=True,
            active_meeting_id="meet_001",
        )
        interpretation = LLMInterpretation(activity="working", meeting_detected=False)
        engine = RuleEngine()

        results = engine.evaluate(self.context, interpretation, state)

        meeting_result = self._result_by_rule(results, "meeting_rule")
        self.assertTrue(meeting_result.triggered)
        self.assertEqual(meeting_result.action_type, "close_meeting")
        self.assertTrue(meeting_result.payload["summary_required"])

    def test_global_anti_spam_blocks_notification_within_ten_minutes(self):
        state = UserState(
            user_id="user_001",
            current_activity="working",
            current_session_duration_minutes=61,
            last_hydration_reminder_at=self.now - timedelta(minutes=5),
        )
        interpretation = LLMInterpretation(activity="working", is_break=False)
        engine = RuleEngine()

        results = engine.evaluate(self.context, interpretation, state)

        break_result = self._result_by_rule(results, "break_reminder_rule")
        self.assertFalse(break_result.triggered)
        self.assertEqual(break_result.action_type, "none")
        self.assertEqual(break_result.payload["blocked_by"], "global_cooldown")

    def test_type_anti_spam_blocks_same_notification_type(self):
        state = UserState(
            user_id="user_001",
            last_break_reminder_at=self.now - timedelta(minutes=20),
        )
        interpretation = LLMInterpretation(activity="working")
        engine = RuleEngine(rules=[AlwaysNotifyRule("break_reminder")])

        results = engine.evaluate(self.context, interpretation, state)

        self.assertEqual(len(results), 1)
        self.assertFalse(results[0].triggered)
        self.assertEqual(results[0].payload["blocked_by"], "type_cooldown")


if __name__ == "__main__":
    unittest.main()
