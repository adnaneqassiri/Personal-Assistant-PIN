from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.rules.base import Rule
from Decision_engine.utils.time import minutes_between


class HydrationReminderRule(Rule):
    rule_name = "hydration_reminder_rule"

    def evaluate(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        state: UserState,
    ) -> RuleResult:
        if interpretation.activity in ("break", "rest", "unknown"):
            return RuleResult(rule_name=self.rule_name)

        if state.current_session_duration_minutes <= 90:
            return RuleResult(rule_name=self.rule_name)

        minutes_since_last = None
        if state.last_hydration_reminder_at is not None:
            minutes_since_last = minutes_between(
                state.last_hydration_reminder_at,
                context.context_timestamp,
            )
            if minutes_since_last <= 90:
                return RuleResult(rule_name=self.rule_name)

        return RuleResult(
            rule_name=self.rule_name,
            triggered=True,
            priority="low",
            action_type="send_notification",
            reason="User has been active for more than 90 minutes without a recent hydration reminder.",
            payload={
                "notification_type": "hydration_reminder",
                "message": "Remember to drink some water.",
                "minutes_since_last_hydration_reminder": minutes_since_last,
            },
        )
