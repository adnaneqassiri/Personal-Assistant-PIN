import unittest
from datetime import datetime, timedelta, timezone

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.meeting import Meeting, TranscriptChunk
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.meeting_manager import MeetingManager


class MeetingManagerTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.manager = MeetingManager()

    def _context(self, context_id="ctx_001", timestamp=None, transcript="Discuss the MVP."):
        return NormalizedContext(
            context_id=context_id,
            user_id="user_001",
            context_timestamp=timestamp or self.now,
            audio_transcript=transcript,
        )

    def test_start_meeting_creates_meeting_and_updates_state(self):
        state = UserState(user_id="user_001")
        interpretation = LLMInterpretation(activity="meeting", meeting_detected=True)

        result = self.manager.process(state, self._context(), interpretation)

        self.assertEqual(result.action, "start_meeting")
        self.assertFalse(result.summary_required)
        self.assertTrue(result.state.in_meeting)
        self.assertIsNotNone(result.state.active_meeting_id)
        self.assertEqual(result.meeting.meeting_id, result.state.active_meeting_id)
        self.assertEqual(result.meeting.status, "active")
        self.assertEqual(len(result.meeting.transcript_chunks), 1)
        self.assertEqual(result.meeting.transcript_chunks[0].text, "Discuss the MVP.")

    def test_append_transcript_adds_chunk_to_active_meeting(self):
        state = UserState(
            user_id="user_001",
            in_meeting=True,
            active_meeting_id="meet_001",
        )
        active_meeting = Meeting(
            meeting_id="meet_001",
            user_id="user_001",
            started_at=self.now - timedelta(minutes=5),
            transcript_chunks=[
                TranscriptChunk(
                    timestamp=self.now - timedelta(minutes=5),
                    text="Initial discussion.",
                    source_context_id="ctx_000",
                )
            ],
            source_context_ids=["ctx_000"],
        )
        interpretation = LLMInterpretation(activity="meeting", meeting_detected=True)

        result = self.manager.process(
            state,
            self._context("ctx_002", transcript="Continue planning."),
            interpretation,
            active_meeting,
        )

        self.assertEqual(result.action, "append_meeting_transcript")
        self.assertTrue(result.state.in_meeting)
        self.assertEqual(len(result.meeting.transcript_chunks), 2)
        self.assertEqual(result.meeting.transcript_chunks[-1].text, "Continue planning.")
        self.assertIn("ctx_002", result.meeting.source_context_ids)

    def test_close_meeting_marks_closed_and_requires_summary(self):
        state = UserState(
            user_id="user_001",
            in_meeting=True,
            active_meeting_id="meet_001",
        )
        active_meeting = Meeting(
            meeting_id="meet_001",
            user_id="user_001",
            started_at=self.now - timedelta(minutes=10),
            source_context_ids=["ctx_000"],
        )
        interpretation = LLMInterpretation(activity="working", meeting_detected=False)

        result = self.manager.process(
            state,
            self._context("ctx_003"),
            interpretation,
            active_meeting,
        )

        self.assertEqual(result.action, "close_meeting")
        self.assertTrue(result.summary_required)
        self.assertFalse(result.state.in_meeting)
        self.assertIsNone(result.state.active_meeting_id)
        self.assertEqual(result.meeting.status, "closed")
        self.assertEqual(result.meeting.ended_at, self.now)
        self.assertIn("ctx_003", result.meeting.source_context_ids)

    def test_no_meeting_change_returns_no_action(self):
        state = UserState(user_id="user_001")
        interpretation = LLMInterpretation(activity="working", meeting_detected=False)

        result = self.manager.process(state, self._context(), interpretation)

        self.assertEqual(result.action, "none")
        self.assertFalse(result.summary_required)
        self.assertFalse(result.state.in_meeting)
        self.assertIsNone(result.meeting)


if __name__ == "__main__":
    unittest.main()
