import unittest
from datetime import datetime, timedelta, timezone

from Decision_engine.config.settings import Settings
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.significance_detector import detect_significance


class SignificanceDetectorTest(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(
            significance_periodic_minutes=2,
            visual_similarity_threshold=0.75,
            object_change_threshold=0.50,
        )
        self.now = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.last_context = self._context(
            context_id="ctx_previous",
            timestamp=self.now - timedelta(minutes=1),
            visual_description="User is sitting at a desk with a laptop.",
            objects=["laptop", "desk", "bottle"],
            audio_transcript="We need to finish the decision engine.",
            audio_keywords=["decision engine", "mvp"],
            location_label="home",
            zone_type="home",
        )
        self.state = UserState(
            user_id="user_001",
            last_llm_interpretation_at=self.now - timedelta(minutes=1),
        )

    def _context(
        self,
        context_id,
        timestamp,
        visual_description="User is sitting at a desk with a laptop.",
        objects=None,
        audio_transcript="We need to finish the decision engine.",
        audio_keywords=None,
        location_label="home",
        zone_type="home",
    ):
        return NormalizedContext(
            context_id=context_id,
            user_id="user_001",
            context_timestamp=timestamp,
            visual_description=visual_description,
            objects=objects if objects is not None else ["laptop", "desk", "bottle"],
            audio_transcript=audio_transcript,
            audio_keywords=audio_keywords
            if audio_keywords is not None
            else ["decision engine", "mvp"],
            location_label=location_label,
            zone_type=zone_type,
        )

    def test_calls_llm_when_no_last_significant_context(self):
        context = self._context("ctx_current", self.now)

        result = detect_significance(context, self.state, None, self.settings)

        self.assertTrue(result.should_call_llm)
        self.assertEqual(result.reason, "no_last_significant_context")

    def test_calls_llm_when_audio_transcript_changed(self):
        context = self._context(
            "ctx_current",
            self.now,
            audio_transcript="The meeting starts in five minutes.",
        )

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertTrue(result.transcript_changed)
        self.assertIn("audio_transcript_changed", result.reasons)

    def test_empty_current_transcript_does_not_trigger_transcript_change(self):
        context = self._context("ctx_current", self.now, audio_transcript="")

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertFalse(result.transcript_changed)
        self.assertNotIn("audio_transcript_changed", result.reasons)

    def test_calls_llm_when_new_audio_keywords_appear(self):
        context = self._context(
            "ctx_current",
            self.now,
            audio_keywords=["decision engine", "mvp", "deadline"],
        )

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertTrue(result.keywords_changed)
        self.assertEqual(result.new_audio_keywords, ["deadline"])

    def test_calls_llm_when_location_changes(self):
        context = self._context(
            "ctx_current",
            self.now,
            location_label="office",
            zone_type="workplace",
        )

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertTrue(result.location_changed)
        self.assertIn("location_changed", result.reasons)

    def test_calls_llm_when_visual_similarity_is_below_threshold(self):
        context = self._context(
            "ctx_current",
            self.now,
            visual_description="User is driving on a road.",
        )

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertLess(result.visual_similarity, self.settings.visual_similarity_threshold)
        self.assertIn("visual_description_changed", result.reasons)

    def test_calls_llm_when_objects_change_strongly(self):
        context = self._context(
            "ctx_current",
            self.now,
            objects=["car", "road", "steering wheel"],
        )

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertTrue(result.objects_changed)
        self.assertEqual(result.object_change_ratio, 1.0)

    def test_calls_llm_when_periodic_threshold_is_reached(self):
        context = self._context("ctx_current", self.now)
        state = UserState(
            user_id="user_001",
            last_llm_interpretation_at=self.now - timedelta(minutes=2),
        )

        result = detect_significance(
            context, state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertEqual(result.minutes_since_last_llm, 2.0)
        self.assertIn("periodic_llm_check", result.reasons)

    def test_calls_llm_when_no_previous_llm_call_is_recorded(self):
        context = self._context("ctx_current", self.now)
        state = UserState(user_id="user_001")

        result = detect_significance(
            context, state, self.last_context, self.settings
        )

        self.assertTrue(result.should_call_llm)
        self.assertEqual(result.reason, "no_previous_llm_call")
        self.assertIsNone(result.minutes_since_last_llm)

    def test_does_not_call_llm_for_duplicate_low_signal_context(self):
        context = self._context("ctx_current", self.now)

        result = detect_significance(
            context, self.state, self.last_context, self.settings
        )

        self.assertFalse(result.should_call_llm)
        self.assertEqual(result.reason, "duplicate_or_low_signal")
        self.assertEqual(result.reasons, [])
        self.assertEqual(result.visual_similarity, 1.0)
        self.assertFalse(result.keywords_changed)
        self.assertFalse(result.location_changed)
        self.assertFalse(result.objects_changed)


if __name__ == "__main__":
    unittest.main()
