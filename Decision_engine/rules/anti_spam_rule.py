from typing import List, Optional

from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.utils.time import minutes_between


class AntiSpamRule(object):
    rule_name = "anti_spam_rule"

    def __init__(self, global_notification_cooldown_minutes: int = 10):
        self.global_notification_cooldown_minutes = global_notification_cooldown_minutes

    def filter_results(
        self,
        results: List[RuleResult],
        context: NormalizedContext,
        state: UserState,
    ) -> List[RuleResult]:
        return [
            self._filter_result(result, context, state)
            if result.triggered and result.action_type == "send_notification"
            else result
            for result in results
        ]

    def _filter_result(
        self,
        result: RuleResult,
        context: NormalizedContext,
        state: UserState,
    ) -> RuleResult:
        notification_type = result.payload.get("notification_type")

        type_last_sent_at = self._last_sent_for_type(notification_type, state)
        if type_last_sent_at is not None:
            type_minutes = minutes_between(type_last_sent_at, context.context_timestamp)
            if type_minutes <= self._type_cooldown(notification_type):
                return self._blocked_result(
                    result,
                    "Notification blocked by type cooldown.",
                    "type_cooldown",
                )

        global_last_sent_at = self._last_global_notification_at(state)
        if global_last_sent_at is not None:
            global_minutes = minutes_between(
                global_last_sent_at,
                context.context_timestamp,
            )
            if global_minutes <= self.global_notification_cooldown_minutes:
                return self._blocked_result(
                    result,
                    "Notification blocked by global cooldown.",
                    "global_cooldown",
                )

        return result

    def _last_sent_for_type(self, notification_type: Optional[str], state: UserState):
        if notification_type == "break_reminder":
            return state.last_break_reminder_at
        if notification_type == "hydration_reminder":
            return state.last_hydration_reminder_at
        return None

    def _type_cooldown(self, notification_type: Optional[str]) -> int:
        if notification_type == "break_reminder":
            return 30
        if notification_type == "hydration_reminder":
            return 90
        return 0

    def _last_global_notification_at(self, state: UserState):
        timestamps = [
            state.last_break_reminder_at,
            state.last_hydration_reminder_at,
        ]
        present = [timestamp for timestamp in timestamps if timestamp is not None]
        if not present:
            return None
        return max(present)

    def _blocked_result(
        self,
        result: RuleResult,
        reason: str,
        blocked_by: str,
    ) -> RuleResult:
        payload = dict(result.payload)
        payload["blocked_by"] = blocked_by
        return RuleResult(
            rule_name=result.rule_name,
            triggered=False,
            priority=result.priority,
            action_type="none",
            reason=reason,
            payload=payload,
        )
