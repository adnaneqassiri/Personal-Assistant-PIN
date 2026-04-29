from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.rules.base import Rule
from Decision_engine.utils.time import minutes_between


class BreakReminderRule(Rule):
    rule_name = "break_reminder_rule"

    def evaluate(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        state: UserState,
    ) -> RuleResult:
        if interpretation.activity != "working":
            return RuleResult(rule_name=self.rule_name)

        if interpretation.is_break:
            return RuleResult(rule_name=self.rule_name)

        if state.current_session_duration_minutes <= 60:
            return RuleResult(rule_name=self.rule_name)

        minutes_since_last = None
        if state.last_break_reminder_at is not None:
            minutes_since_last = minutes_between(
                state.last_break_reminder_at,
                context.context_timestamp,
            )
            if minutes_since_last <= 30:
                return RuleResult(rule_name=self.rule_name)

        return RuleResult(
            rule_name=self.rule_name,
            triggered=True,
            priority="medium",
            action_type="send_notification",
            reason="User has been working for more than 60 minutes without a recent break reminder.",
            payload={
                "notification_type": "break_reminder",
                "message": "You have been working for a while. Consider taking a short break.",
                "minutes_since_last_break_reminder": minutes_since_last,
            },
        )
