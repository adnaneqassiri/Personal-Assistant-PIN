from typing import List, Optional

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState
from Decision_engine.rules.anti_spam_rule import AntiSpamRule
from Decision_engine.rules.base import Rule
from Decision_engine.rules.break_rule import BreakReminderRule
from Decision_engine.rules.hydration_rule import HydrationReminderRule
from Decision_engine.rules.meeting_rule import MeetingRule


class RuleEngine(object):
    def __init__(
        self,
        rules: Optional[List[Rule]] = None,
        anti_spam_rule: Optional[AntiSpamRule] = None,
    ):
        self.rules = rules or [
            BreakReminderRule(),
            HydrationReminderRule(),
            MeetingRule(),
        ]
        self.anti_spam_rule = anti_spam_rule or AntiSpamRule()

    def evaluate(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        state: UserState,
    ) -> List[RuleResult]:
        results = [
            rule.evaluate(context=context, interpretation=interpretation, state=state)
            for rule in self.rules
        ]
        return self.anti_spam_rule.filter_results(results, context, state)
