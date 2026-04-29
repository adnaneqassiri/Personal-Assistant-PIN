import unittest
from datetime import datetime, timezone

from Decision_engine.llm.base import LLMClient, fallback_unknown_interpretation
from Decision_engine.llm.json_repair import (
    parse_llm_interpretation,
    parse_llm_interpretation_or_fallback,
)
from Decision_engine.llm.prompts import build_interpretation_prompt
from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState


class FakeLLMClient(LLMClient):
    def interpret_context(
        self,
        normalized_context,
        user_state,
        last_significant_context=None,
    ):
        return LLMInterpretation(activity="working", confidence=0.8)


class LLMLayerTest(unittest.TestCase):
    def setUp(self):
        self.timestamp = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.context = NormalizedContext(
            context_id="ctx_001",
            user_id="user_001",
            context_timestamp=self.timestamp,
            visual_description="User is working at a desk.",
            objects=["laptop", "desk"],
            audio_transcript="We need to finish the decision engine.",
            audio_keywords=["decision engine"],
            location_label="home",
            zone_type="home",
            global_confidence=0.8,
        )
        self.last_context = NormalizedContext(
            context_id="ctx_000",
            user_id="user_001",
            context_timestamp=self.timestamp,
            visual_description="User is at a desk.",
            objects=["laptop"],
            audio_transcript="Previous technical discussion.",
            audio_keywords=["technical"],
        )
        self.state = UserState(user_id="user_001", current_activity="working")

    def test_prompt_contains_required_inputs_and_no_action_instructions(self):
        prompt = build_interpretation_prompt(
            self.context,
            self.state,
            self.last_context,
        )

        self.assertIn("normalized_context", prompt)
        self.assertIn("user_state", prompt)
        self.assertIn("last_significant_context", prompt)
        self.assertIn('"context_id": "ctx_001"', prompt)
        self.assertIn('"current_activity": "working"', prompt)
        self.assertIn("Your only task is to interpret context", prompt)
        self.assertIn("must not decide actions", prompt)

    def test_valid_json_is_parsed_to_interpretation(self):
        raw = """
        {
          "activity": "working",
          "activity_label": "focused desk work",
          "confidence": 0.91,
          "meeting_detected": false,
          "is_break": false,
          "is_movement": false,
          "summary": "The user is working at a desk.",
          "signals": ["laptop visible", "technical audio"],
          "importance": "medium",
          "memory_worthy": true
        }
        """

        result = parse_llm_interpretation(raw)

        self.assertEqual(result.activity, "working")
        self.assertEqual(result.activity_label, "focused desk work")
        self.assertEqual(result.confidence, 0.91)
        self.assertTrue(result.memory_worthy)

    def test_broken_json_is_repaired_when_possible(self):
        raw = """
        ```json
        {
          'activity': 'meeting',
          'activity_label': 'technical meeting',
          'confidence': 0.82,
          'meeting_detected': True,
          'is_break': False,
          'is_movement': False,
          'summary': 'A technical meeting is happening.',
          'signals': ['multiple speakers', 'technical terms'],
          'importance': 'high',
          'memory_worthy': True,
        }
        ```
        """

        result = parse_llm_interpretation(raw)

        self.assertEqual(result.activity, "meeting")
        self.assertTrue(result.meeting_detected)
        self.assertEqual(result.importance, "high")

    def test_fallback_unknown_when_parsing_is_impossible(self):
        result = parse_llm_interpretation_or_fallback("not json at all")

        self.assertEqual(result.activity, "unknown")
        self.assertEqual(result.confidence, 0.0)
        self.assertFalse(result.memory_worthy)

    def test_fallback_helper_returns_unknown_interpretation(self):
        result = fallback_unknown_interpretation("custom fallback")

        self.assertEqual(result.activity, "unknown")
        self.assertEqual(result.summary, "custom fallback")

    def test_llm_client_interface_keeps_retry_count(self):
        client = FakeLLMClient(retry_count=5)

        result = client.interpret_context(self.context, self.state)

        self.assertEqual(client.retry_count, 5)
        self.assertEqual(result.activity, "working")


if __name__ == "__main__":
    unittest.main()
