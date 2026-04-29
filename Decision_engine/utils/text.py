import re
from typing import Iterable, List, Optional


_WHITESPACE_RE = re.compile(r"\s+")
_TOKEN_RE = re.compile(r"[A-Za-z0-9_]+")


def clean_text(value: Optional[str]) -> str:
    if value is None:
        return ""
    return _WHITESPACE_RE.sub(" ", str(value)).strip()


def normalize_terms(values: Optional[Iterable[str]]) -> List[str]:
    if not values:
        return []

    normalized = []
    seen = set()
    for value in values:
        term = clean_text(value).lower()
        if not term or term in seen:
            continue
        seen.add(term)
        normalized.append(term)
    return normalized


def average_available(values: Iterable[Optional[float]]) -> float:
    present = [float(value) for value in values if value is not None]
    if not present:
        return 0.0
    return sum(present) / len(present)


def _tokens(value: str) -> set:
    return set(match.group(0).lower() for match in _TOKEN_RE.finditer(clean_text(value)))


def jaccard_similarity(left: Optional[str], right: Optional[str]) -> float:
    left_tokens = _tokens(left or "")
    right_tokens = _tokens(right or "")

    if not left_tokens and not right_tokens:
        return 1.0
    if not left_tokens or not right_tokens:
        return 0.0

    return float(len(left_tokens & right_tokens)) / float(len(left_tokens | right_tokens))
