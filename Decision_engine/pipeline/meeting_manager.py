from typing import Optional

from pydantic import BaseModel

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.meeting import Meeting, TranscriptChunk
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.utils.ids import generate_id
from Decision_engine.utils.pydantic import copy_model
from Decision_engine.utils.text import clean_text


class MeetingManagerResult(BaseModel):
    state: UserState
    meeting: Optional[Meeting] = None
    action: str = "none"
    summary_required: bool = False


class MeetingManager(object):
    def process(
        self,
        state: UserState,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        active_meeting: Optional[Meeting] = None,
    ) -> MeetingManagerResult:
        if interpretation.meeting_detected and not state.in_meeting:
            return self.start_meeting(state, context)

        if interpretation.meeting_detected and state.in_meeting:
            return self.append_transcript(state, context, active_meeting)

        if not interpretation.meeting_detected and state.in_meeting:
            return self.close_meeting(state, context, active_meeting)

        return MeetingManagerResult(state=copy_model(state, deep=True))

    def start_meeting(
        self, state: UserState, context: NormalizedContext
    ) -> MeetingManagerResult:
        updated_state = copy_model(state, deep=True)
        meeting_id = generate_id("meet")
        updated_state.in_meeting = True
        updated_state.active_meeting_id = meeting_id

        transcript_chunks = []
        transcript = clean_text(context.audio_transcript)
        if transcript:
            transcript_chunks.append(
                TranscriptChunk(
                    timestamp=context.context_timestamp,
                    text=transcript,
                    source_context_id=context.context_id,
                )
            )

        meeting = Meeting(
            meeting_id=meeting_id,
            user_id=context.user_id,
            started_at=context.context_timestamp,
            transcript_chunks=transcript_chunks,
            source_context_ids=[context.context_id],
        )

        return MeetingManagerResult(
            state=updated_state,
            meeting=meeting,
            action="start_meeting",
            summary_required=False,
        )

    def append_transcript(
        self,
        state: UserState,
        context: NormalizedContext,
        active_meeting: Optional[Meeting],
    ) -> MeetingManagerResult:
        updated_state = copy_model(state, deep=True)

        if active_meeting is None:
            return MeetingManagerResult(
                state=updated_state,
                meeting=None,
                action="append_meeting_transcript",
                summary_required=False,
            )

        meeting = copy_model(active_meeting, deep=True)
        transcript = clean_text(context.audio_transcript)
        if transcript:
            meeting.transcript_chunks.append(
                TranscriptChunk(
                    timestamp=context.context_timestamp,
                    text=transcript,
                    source_context_id=context.context_id,
                )
            )

        if context.context_id not in meeting.source_context_ids:
            meeting.source_context_ids.append(context.context_id)

        return MeetingManagerResult(
            state=updated_state,
            meeting=meeting,
            action="append_meeting_transcript",
            summary_required=False,
        )

    def close_meeting(
        self,
        state: UserState,
        context: NormalizedContext,
        active_meeting: Optional[Meeting],
    ) -> MeetingManagerResult:
        updated_state = copy_model(state, deep=True)
        updated_state.in_meeting = False
        updated_state.active_meeting_id = None

        meeting = copy_model(active_meeting, deep=True) if active_meeting else None
        if meeting is not None:
            meeting.status = "closed"
            meeting.ended_at = context.context_timestamp
            if context.context_id not in meeting.source_context_ids:
                meeting.source_context_ids.append(context.context_id)

        return MeetingManagerResult(
            state=updated_state,
            meeting=meeting,
            action="close_meeting",
            summary_required=True,
        )
