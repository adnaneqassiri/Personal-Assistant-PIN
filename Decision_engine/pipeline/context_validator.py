from copy import deepcopy
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError

from Decision_engine.models.raw_context import RawContextEvent
from Decision_engine.utils.time import parse_datetime_utc


class ValidationResult(BaseModel):
    is_valid: bool
    raw_context: Optional[RawContextEvent] = None
    errors: List[str] = Field(default_factory=list)


def _require_non_empty_string(payload: Dict[str, Any], field_name: str) -> List[str]:
    value = payload.get(field_name)
    if not isinstance(value, str) or not value.strip():
        return ["%s is required" % field_name]
    return []


def _normalize_optional_timestamp(
    payload: Dict[str, Any], section_name: str, errors: List[str]
) -> None:
    section = payload.get(section_name)
    if section is None:
        return

    if not isinstance(section, dict):
        errors.append("%s must be an object when provided" % section_name)
        return

    if "timestamp" not in section or section.get("timestamp") in (None, ""):
        section["timestamp"] = None
        return

    try:
        section["timestamp"] = parse_datetime_utc(section["timestamp"])
    except Exception as exc:
        errors.append("%s.timestamp is invalid: %s" % (section_name, exc))


def validate_raw_context(payload: Any) -> ValidationResult:
    if not isinstance(payload, dict):
        return ValidationResult(is_valid=False, errors=["payload must be an object"])

    normalized_payload = deepcopy(payload)
    errors = []

    for field_name in ("context_id", "user_id", "created_at"):
        errors.extend(_require_non_empty_string(normalized_payload, field_name))

    if isinstance(normalized_payload.get("created_at"), str):
        try:
            normalized_payload["created_at"] = parse_datetime_utc(
                normalized_payload["created_at"]
            )
        except Exception as exc:
            errors.append("created_at is invalid: %s" % exc)

    for section_name in ("vision", "audio", "location"):
        _normalize_optional_timestamp(normalized_payload, section_name, errors)

    if errors:
        return ValidationResult(is_valid=False, errors=errors)

    try:
        raw_context = RawContextEvent(**normalized_payload)
    except ValidationError as exc:
        return ValidationResult(is_valid=False, errors=[str(exc)])

    return ValidationResult(is_valid=True, raw_context=raw_context, errors=[])
