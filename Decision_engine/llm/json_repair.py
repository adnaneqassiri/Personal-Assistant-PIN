import ast
import json
import re
from typing import Any, Callable, Dict, Optional

from Decision_engine.llm.base import fallback_unknown_interpretation
from Decision_engine.models.llm_interpretation import LLMInterpretation


_TRAILING_COMMA_RE = re.compile(r",(\s*[}\]])")
_BARE_BOOL_NULL_REPLACEMENTS = (
    (": True", ": true"),
    (": False", ": false"),
    (": None", ": null"),
)


def _extract_json_candidate(raw_text: Any) -> str:
    if isinstance(raw_text, dict):
        return json.dumps(raw_text)

    text = str(raw_text).strip()

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
        raise ValueError("No JSON object found in LLM response")

    return text[start : end + 1]


def _repair_json_text(candidate: str) -> str:
    repaired = _TRAILING_COMMA_RE.sub(r"\1", candidate)
    for old, new in _BARE_BOOL_NULL_REPLACEMENTS:
        repaired = repaired.replace(old, new)
    return repaired


def _parse_candidate(candidate: str) -> Dict[str, Any]:
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    repaired = _repair_json_text(candidate)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass

    try:
        parsed = ast.literal_eval(candidate)
    except (SyntaxError, ValueError):
        parsed = ast.literal_eval(repaired)

    if not isinstance(parsed, dict):
        raise ValueError("LLM response is not a JSON object")
    return parsed


def parse_llm_interpretation(raw_text: Any) -> LLMInterpretation:
    candidate = _extract_json_candidate(raw_text)
    parsed = _parse_candidate(candidate)
    return LLMInterpretation(**parsed)


def parse_llm_interpretation_or_fallback(
    raw_text: Any,
    on_error: Optional[Callable[[Exception], None]] = None,
) -> LLMInterpretation:
    try:
        return parse_llm_interpretation(raw_text)
    except Exception as exc:
        if on_error is not None:
            on_error(exc)
        return fallback_unknown_interpretation()
