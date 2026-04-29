from abc import ABC, abstractmethod

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.models.user_state import UserState


class Rule(ABC):
    rule_name = "base_rule"

    @abstractmethod
    def evaluate(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        state: UserState,
    ) -> RuleResult:
        raise NotImplementedError
