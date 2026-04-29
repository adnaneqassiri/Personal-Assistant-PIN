import json
from typing import Any, Dict, Optional

from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState


SYSTEM_PROMPT = """
You are the interpretation layer of a multimodal personal assistant Decision Engine.

Your only task is to interpret context. You must not decide actions, notifications,
storage operations, or business rules.

Allowed activities:
- working
- meeting
- break
- movement
- hydration
- rest
- unknown

Return only one valid JSON object with exactly these fields:
{
  "activity": "working|meeting|break|movement|hydration|rest|unknown",
  "activity_label": "short human-readable label",
  "confidence": 0.0,
  "meeting_detected": false,
  "is_break": false,
  "is_movement": false,
  "summary": "short factual summary",
  "signals": ["signal 1", "signal 2"],
  "importance": "low|medium|high",
  "memory_worthy": false
}

Rules:
- Return JSON only. No Markdown. No text before or after the JSON.
- Use only the provided normalized_context, user_state, and last_significant_context.
- Do not invent facts that are absent from the input.
- If the input is insufficient, set activity to "unknown" and confidence to 0.0.
- confidence must be between 0.0 and 1.0.
- memory_worthy should be true only when the context may help future user questions.
""".strip()


def _model_to_dict(model: Any) -> Dict[str, Any]:
    if model is None:
        return {}
    if hasattr(model, "model_dump"):
        return model.model_dump(mode="json")
    return model.dict()


def build_interpretation_prompt(
    normalized_context: NormalizedContext,
    user_state: UserState,
    last_significant_context: Optional[NormalizedContext] = None,
) -> str:
    payload = {
        "normalized_context": _model_to_dict(normalized_context),
        "user_state": _model_to_dict(user_state),
        "last_significant_context": _model_to_dict(last_significant_context)
        if last_significant_context is not None
        else None,
    }

    return "%s\n\nInput JSON:\n%s" % (
        SYSTEM_PROMPT,
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True),
    )


DAILY_SUMMARY_PROMPT = """
You are summarizing one day of personal assistant context.

Return only one valid JSON object with exactly these fields:
{
  "summary": "concise English summary of the day",
  "important_events": ["event 1", "event 2"]
}

Rules:
- Return JSON only. No Markdown. No text before or after the JSON.
- Use only the provided daily_context.
- Keep the summary factual and concise.
- Include only useful events that could help the user remember the day.
""".strip()


def build_daily_summary_prompt(daily_context: Dict[str, Any]) -> str:
    return "%s\n\nDaily context JSON:\n%s" % (
        DAILY_SUMMARY_PROMPT,
        json.dumps(daily_context, ensure_ascii=False, indent=2, sort_keys=True),
    )
