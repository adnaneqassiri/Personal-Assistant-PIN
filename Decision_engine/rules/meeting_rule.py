from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.rules.base import Rule


class MeetingRule(Rule):
    rule_name = "meeting_rule"

    def evaluate(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        state: UserState,
    ) -> RuleResult:
        if interpretation.meeting_detected and not state.in_meeting:
            return RuleResult(
                rule_name=self.rule_name,
                triggered=True,
                priority="medium",
                action_type="start_meeting",
                reason="A meeting was detected while no meeting is active.",
                payload={"source_context_id": context.context_id},
            )

        if interpretation.meeting_detected and state.in_meeting:
            return RuleResult(
                rule_name=self.rule_name,
                triggered=True,
                priority="low",
                action_type="append_meeting_transcript",
                reason="A meeting is still active; append the current transcript.",
                payload={
                    "meeting_id": state.active_meeting_id,
                    "source_context_id": context.context_id,
                },
            )

        if not interpretation.meeting_detected and state.in_meeting:
            return RuleResult(
                rule_name=self.rule_name,
                triggered=True,
                priority="high",
                action_type="close_meeting",
                reason="Meeting is no longer detected while a meeting is active.",
                payload={
                    "meeting_id": state.active_meeting_id,
                    "summary_required": True,
                    "source_context_id": context.context_id,
                },
            )

        return RuleResult(rule_name=self.rule_name)
