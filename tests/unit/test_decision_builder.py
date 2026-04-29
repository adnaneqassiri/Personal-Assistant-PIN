import unittest
from datetime import datetime, timezone

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.meeting import Meeting
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.decision_builder import DecisionBuilder
from Decision_engine.pipeline.meeting_manager import MeetingManagerResult
from Decision_engine.pipeline.significance_detector import SignificanceResult


class DecisionBuilderTest(unittest.TestCase):
    def setUp(self):
        self.timestamp = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.context = NormalizedContext(
            context_id="ctx_001",
            user_id="user_001",
            context_timestamp=self.timestamp,
            visual_description="User is working at a desk.",
        )
        self.interpretation = LLMInterpretation(
            activity="working",
            activity_label="desk work",
            confidence=0.87,
            summary="The user is working at a desk.",
        )
        self.state = UserState(user_id="user_001", current_activity="working")
        self.significance = SignificanceResult(
            should_call_llm=True,
            reason="audio_transcript_changed",
            reasons=["audio_transcript_changed"],
        )
        self.builder = DecisionBuilder()

    def test_builds_no_action_decision_when_no_rule_is_triggered(self):
        decision = self.builder.build(
            normalized_context=self.context,
            llm_interpretation=self.interpretation,
            user_state=self.state,
            rule_results=[
                RuleResult(rule_name="break_reminder_rule"),
                RuleResult(rule_name="hydration_reminder_rule"),
            ],
            significance_result=self.significance,
        )

        self.assertEqual(decision.decision_type, "no_action")
        self.assertFalse(decision.should_notify)
        self.assertIsNone(decision.notification_type)
        self.assertEqual(decision.rules_triggered, [])
        self.assertEqual(decision.actions, [])
        self.assertEqual(decision.reason, "The user is working at a desk.")
        self.assertEqual(decision.source_context_id, "ctx_001")
        self.assertEqual(decision.confidence, 0.87)

    def test_builds_notification_decision_from_triggered_notification_rule(self):
        rule_result = RuleResult(
            rule_name="break_reminder_rule",
            triggered=True,
            priority="medium",
            action_type="send_notification",
            reason="User has been working for more than 60 minutes.",
            payload={
                "notification_type": "break_reminder",
                "message": "Take a short break.",
            },
        )

        decision = self.builder.build(
            normalized_context=self.context,
            llm_interpretation=self.interpretation,
            user_state=self.state,
            rule_results=[rule_result],
            significance_result=self.significance,
        )

        self.assertEqual(decision.decision_type, "notification")
        self.assertTrue(decision.should_notify)
        self.assertEqual(decision.notification_type, "break_reminder")
        self.assertEqual(decision.rules_triggered, ["break_reminder_rule"])
        self.assertEqual(decision.reason, "User has been working for more than 60 minutes.")
        self.assertEqual(len(decision.actions), 1)
        self.assertEqual(decision.actions[0].type, "notification")
        self.assertEqual(decision.actions[0].target, "notification_service")
        self.assertEqual(decision.actions[0].payload["message"], "Take a short break.")

    def test_builds_meeting_update_from_meeting_manager_result(self):
        meeting = Meeting(
            meeting_id="meet_001",
            user_id="user_001",
            started_at=self.timestamp,
        )
        meeting_result = MeetingManagerResult(
            state=self.state,
            meeting=meeting,
            action="start_meeting",
            summary_required=False,
        )

        decision = self.builder.build(
            normalized_context=self.context,
            llm_interpretation=LLMInterpretation(
                activity="meeting",
                meeting_detected=True,
                confidence=0.8,
            ),
            user_state=self.state,
            rule_results=[],
            significance_result=self.significance,
            meeting_result=meeting_result,
        )

        self.assertEqual(decision.decision_type, "meeting_update")
        self.assertFalse(decision.should_notify)
        self.assertEqual(decision.actions[0].type, "start_meeting")
        self.assertEqual(decision.actions[0].target, "meeting_manager")
        self.assertEqual(decision.actions[0].payload["meeting_id"], "meet_001")
        self.assertFalse(decision.actions[0].payload["summary_required"])

    def test_notification_decision_takes_precedence_over_meeting_update(self):
        rule_result = RuleResult(
            rule_name="hydration_reminder_rule",
            triggered=True,
            action_type="send_notification",
            reason="Hydration reminder is due.",
            payload={"notification_type": "hydration_reminder"},
        )
        meeting = Meeting(
            meeting_id="meet_001",
            user_id="user_001",
            started_at=self.timestamp,
        )
        meeting_result = MeetingManagerResult(
            state=self.state,
            meeting=meeting,
            action="append_meeting_transcript",
            summary_required=False,
        )

        decision = self.builder.build(
            normalized_context=self.context,
            llm_interpretation=self.interpretation,
            user_state=self.state,
            rule_results=[rule_result],
            significance_result=self.significance,
            meeting_result=meeting_result,
        )

        self.assertEqual(decision.decision_type, "notification")
        self.assertEqual(len(decision.actions), 2)
        self.assertEqual(decision.actions[0].type, "notification")
        self.assertEqual(decision.actions[1].type, "append_meeting_transcript")

    def test_rejects_non_significant_event(self):
        significance = SignificanceResult(
            should_call_llm=False,
            reason="duplicate_or_low_signal",
        )

        with self.assertRaises(ValueError):
            self.builder.build(
                normalized_context=self.context,
                llm_interpretation=self.interpretation,
                user_state=self.state,
                rule_results=[],
                significance_result=significance,
            )


if __name__ == "__main__":
    unittest.main()
