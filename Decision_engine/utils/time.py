from datetime import datetime, timezone
from typing import Optional


def ensure_utc_aware(value) -> datetime:
    if value is None:
        raise ValueError("timestamp is required")

    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        text = value.strip()
        if not text:
            raise ValueError("timestamp is empty")
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        parsed = datetime.fromisoformat(text)
    else:
        raise TypeError("timestamp must be a string or datetime")

    if parsed.tzinfo is None or parsed.tzinfo.utcoffset(parsed) is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def parse_datetime_utc(value) -> datetime:
    return ensure_utc_aware(value)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def max_datetime(*values: Optional[datetime]) -> datetime:
    present = [ensure_utc_aware(value) for value in values if value is not None]
    if not present:
        raise ValueError("at least one datetime is required")
    return max(present)


def minutes_between(start: Optional[datetime], end: Optional[datetime]) -> float:
    if start is None or end is None:
        return 0.0

    start_utc = ensure_utc_aware(start)
    end_utc = ensure_utc_aware(end)
    return max((end_utc - start_utc).total_seconds() / 60.0, 0.0)
