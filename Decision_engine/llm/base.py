from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState


def fallback_unknown_interpretation(summary: str = "") -> LLMInterpretation:
    return LLMInterpretation(
        activity="unknown",
        activity_label="unknown",
        confidence=0.0,
        meeting_detected=False,
        is_break=False,
        is_movement=False,
        summary=summary or "The context could not be interpreted.",
        signals=[],
        importance="low",
        memory_worthy=False,
    )


class LLMClient(ABC):
    def __init__(self, retry_count: int = 3):
        self.retry_count = retry_count

    @abstractmethod
    def interpret_context(
        self,
        normalized_context: NormalizedContext,
        user_state: UserState,
        last_significant_context: Optional[NormalizedContext] = None,
    ) -> LLMInterpretation:
        raise NotImplementedError

    def summarize_day(self, daily_context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("summarize_day is not implemented for this LLM client")
