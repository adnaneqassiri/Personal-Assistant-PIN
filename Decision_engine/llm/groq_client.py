import json
import logging
import os
from typing import Any, Dict, Optional

from Decision_engine.config.settings import Settings, get_settings
from Decision_engine.llm.base import LLMClient, fallback_unknown_interpretation
from Decision_engine.llm.json_repair import parse_llm_interpretation_or_fallback
from Decision_engine.llm.prompts import (
    build_daily_summary_prompt,
    build_interpretation_prompt,
)
from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState


logger = logging.getLogger(__name__)


class GroqLLMClient(LLMClient):
    def __init__(
        self,
        chat_model=None,
        settings: Optional[Settings] = None,
        logger_instance=None,
    ):
        self.settings = settings or get_settings()
        super(GroqLLMClient, self).__init__(retry_count=self.settings.llm_retry_count)
        self.chat_model = chat_model or self._build_chat_model()
        self.logger = logger_instance or logger
        self.last_error = None

    def interpret_context(
        self,
        normalized_context: NormalizedContext,
        user_state: UserState,
        last_significant_context: Optional[NormalizedContext] = None,
    ) -> LLMInterpretation:
        prompt = build_interpretation_prompt(
            normalized_context,
            user_state,
            last_significant_context,
        )

        last_error = None
        attempts = max(1, int(self.retry_count))
        for attempt in range(1, attempts + 1):
            try:
                response = self.chat_model.invoke(prompt)
                raw_content = self._extract_content(response)
                return parse_llm_interpretation_or_fallback(
                    raw_content,
                    on_error=self._record_parse_error,
                )
            except Exception as exc:
                last_error = exc
                self.last_error = exc
                self.logger.warning(
                    "Groq LLM interpretation attempt %s/%s failed: %s",
                    attempt,
                    attempts,
                    exc,
                )

        return fallback_unknown_interpretation(
            "LLM interpretation failed after retries: %s" % last_error
        )

    def summarize_day(self, daily_context: Dict[str, Any]) -> Dict[str, Any]:
        prompt = build_daily_summary_prompt(daily_context)
        last_error = None
        attempts = max(1, int(self.retry_count))

        for attempt in range(1, attempts + 1):
            try:
                response = self.chat_model.invoke(prompt)
                raw_content = self._extract_content(response)
                return self._parse_daily_summary(raw_content)
            except Exception as exc:
                last_error = exc
                self.last_error = exc
                self.logger.warning(
                    "Groq daily summary attempt %s/%s failed: %s",
                    attempt,
                    attempts,
                    exc,
                )

        return {
            "summary": "Daily summary generation failed: %s" % last_error,
            "important_events": [],
        }

    def _record_parse_error(self, exc: Exception) -> None:
        self.last_error = exc
        self.logger.warning("Failed to parse Groq LLM response: %s", exc)

    def _extract_content(self, response):
        if hasattr(response, "content"):
            return response.content
        return response

    def _parse_daily_summary(self, raw_content: Any) -> Dict[str, Any]:
        text = str(raw_content).strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end < start:
            raise ValueError("No JSON object found in daily summary response")

        parsed = json.loads(text[start : end + 1])
        return {
            "summary": str(parsed.get("summary", "")),
            "important_events": list(parsed.get("important_events", [])),
        }

    def _build_chat_model(self):
        try:
            from langchain_groq import ChatGroq
        except ImportError as exc:
            raise RuntimeError(
                "langchain-groq is required for GroqLLMClient. "
                "Install it with 'pip install langchain-groq'."
            ) from exc

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to the environment before "
                "creating GroqLLMClient."
            )

        return ChatGroq(
            model=self.settings.groq_model,
            temperature=0,
            api_key=api_key,
        )
