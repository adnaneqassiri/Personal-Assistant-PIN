from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.significance_detector import SignificanceResult
from Decision_engine.utils.pydantic import copy_model
from Decision_engine.utils.time import minutes_between


class StateManager(object):
    def update_state(
        self,
        state: UserState,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        significance: SignificanceResult,
    ) -> UserState:
        updated = copy_model(state, deep=True)
        updated.last_seen_at = context.context_timestamp

        if not significance.should_call_llm:
            return updated

        previous_activity = updated.current_activity
        current_activity = interpretation.activity

        updated.current_activity = current_activity
        updated.last_activity_detected_at = context.context_timestamp
        updated.last_llm_interpretation_at = context.context_timestamp
        updated.last_significant_context_id = context.context_id
        updated.last_significant_visual_description = context.visual_description
        updated.last_significant_audio_keywords = list(context.audio_keywords)
        updated.last_significant_location_label = context.location_label

        if (
            updated.activity_started_at is None
            or previous_activity != current_activity
        ):
            updated.activity_started_at = context.context_timestamp
            updated.current_session_duration_minutes = 0.0
        else:
            updated.current_session_duration_minutes = minutes_between(
                updated.activity_started_at,
                context.context_timestamp,
            )

        if current_activity == "working":
            updated.last_work_detected_at = context.context_timestamp

        if current_activity == "break" or interpretation.is_break:
            updated.last_break_at = context.context_timestamp

        return updated
