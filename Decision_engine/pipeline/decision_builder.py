from typing import List, Optional

from Decision_engine.models.decision import Action, Decision
from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.meeting_manager import MeetingManagerResult
from Decision_engine.pipeline.significance_detector import SignificanceResult
from Decision_engine.utils.ids import generate_id


class DecisionBuilder(object):
    def build(
        self,
        normalized_context: NormalizedContext,
        llm_interpretation: LLMInterpretation,
        user_state: UserState,
        rule_results: List[RuleResult],
        significance_result: SignificanceResult,
        meeting_result: Optional[MeetingManagerResult] = None,
    ) -> Decision:
        if not significance_result.should_call_llm:
            raise ValueError("Decision can only be built for significant events")

        triggered_rules = [result for result in rule_results if result.triggered]
        rules_triggered = [result.rule_name for result in triggered_rules]
        actions = self._build_actions(triggered_rules, meeting_result)
        notification_action = self._first_notification_action(actions)

        return Decision(
            decision_id=generate_id("dec"),
            user_id=normalized_context.user_id,
            timestamp=normalized_context.context_timestamp,
            decision_type=self._decision_type(triggered_rules, meeting_result),
            should_notify=notification_action is not None,
            notification_type=self._notification_type(notification_action),
            activity=llm_interpretation.activity,
            confidence=llm_interpretation.confidence,
            reason=self._reason(
                triggered_rules,
                significance_result,
                llm_interpretation,
                meeting_result,
            ),
            rules_triggered=rules_triggered,
            actions=actions,
            source_context_id=normalized_context.context_id,
        )

    def _build_actions(
        self,
        triggered_rules: List[RuleResult],
        meeting_result: Optional[MeetingManagerResult],
    ) -> List[Action]:
        actions = []

        for result in triggered_rules:
            if result.action_type == "send_notification":
                actions.append(
                    Action(
                        type="notification",
                        target="notification_service",
                        payload=dict(result.payload),
                    )
                )
            elif result.action_type == "save_activity":
                actions.append(
                    Action(
                        type="activity_update",
                        target="activity_tracker",
                        payload=dict(result.payload),
                    )
                )

        if meeting_result is not None and meeting_result.action != "none":
            actions.append(
                Action(
                    type=meeting_result.action,
                    target="meeting_manager",
                    payload={
                        "summary_required": meeting_result.summary_required,
                        "meeting_id": meeting_result.meeting.meeting_id
                        if meeting_result.meeting is not None
                        else None,
                    },
                )
            )

        return actions

    def _decision_type(
        self,
        triggered_rules: List[RuleResult],
        meeting_result: Optional[MeetingManagerResult],
    ) -> str:
        if any(result.action_type == "send_notification" for result in triggered_rules):
            return "notification"

        if meeting_result is not None and meeting_result.action != "none":
            return "meeting_update"

        if any(result.action_type == "save_activity" for result in triggered_rules):
            return "activity_update"

        return "no_action"

    def _first_notification_action(self, actions: List[Action]) -> Optional[Action]:
        for action in actions:
            if action.type == "notification":
                return action
        return None

    def _notification_type(self, action: Optional[Action]) -> Optional[str]:
        if action is None:
            return None
        value = action.payload.get("notification_type")
        return str(value) if value else None

    def _reason(
        self,
        triggered_rules: List[RuleResult],
        significance_result: SignificanceResult,
        llm_interpretation: LLMInterpretation,
        meeting_result: Optional[MeetingManagerResult],
    ) -> str:
        rule_reasons = [result.reason for result in triggered_rules if result.reason]
        if rule_reasons:
            return " ".join(rule_reasons)

        if meeting_result is not None and meeting_result.action != "none":
            return "Meeting manager produced action: %s." % meeting_result.action

        if llm_interpretation.summary:
            return llm_interpretation.summary

        return "Significant context without triggered rules: %s." % (
            significance_result.reason
        )
