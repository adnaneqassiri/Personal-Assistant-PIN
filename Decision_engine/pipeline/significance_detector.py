from typing import List, Optional

from pydantic import BaseModel, Field

from Decision_engine.config.settings import Settings, get_settings
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.utils.text import clean_text, jaccard_similarity
from Decision_engine.utils.time import minutes_between


class SignificanceResult(BaseModel):
    should_call_llm: bool
    reason: str
    reasons: List[str] = Field(default_factory=list)
    visual_similarity: float = Field(default=1.0, ge=0.0, le=1.0)
    keywords_changed: bool = False
    new_audio_keywords: List[str] = Field(default_factory=list)
    transcript_changed: bool = False
    location_changed: bool = False
    objects_changed: bool = False
    object_change_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    minutes_since_last_llm: Optional[float] = None


def _normalized_text(value: str) -> str:
    return clean_text(value).lower()


def _new_terms(current: List[str], previous: List[str]) -> List[str]:
    previous_set = set(previous or [])
    return [term for term in current or [] if term not in previous_set]


def _change_ratio(current: List[str], previous: List[str]) -> float:
    current_set = set(current or [])
    previous_set = set(previous or [])

    if not current_set and not previous_set:
        return 0.0

    union = current_set | previous_set
    changed = current_set ^ previous_set
    return float(len(changed)) / float(len(union))


def detect_significance(
    context: NormalizedContext,
    user_state: UserState,
    last_significant_context: Optional[NormalizedContext],
    settings: Optional[Settings] = None,
) -> SignificanceResult:
    settings = settings or get_settings()

    if last_significant_context is None:
        return SignificanceResult(
            should_call_llm=True,
            reason="no_last_significant_context",
            reasons=["no_last_significant_context"],
        )

    reasons = []

    current_transcript = _normalized_text(context.audio_transcript)
    previous_transcript = _normalized_text(last_significant_context.audio_transcript)
    transcript_changed = bool(
        current_transcript and current_transcript != previous_transcript
    )
    if transcript_changed:
        reasons.append("audio_transcript_changed")

    new_audio_keywords = _new_terms(
        context.audio_keywords,
        last_significant_context.audio_keywords,
    )
    keywords_changed = bool(new_audio_keywords)
    if keywords_changed:
        reasons.append("new_audio_keywords")

    location_changed = (
        context.location_label != last_significant_context.location_label
        or context.zone_type != last_significant_context.zone_type
    )
    if location_changed:
        reasons.append("location_changed")

    visual_similarity = jaccard_similarity(
        context.visual_description,
        last_significant_context.visual_description,
    )
    if visual_similarity < settings.visual_similarity_threshold:
        reasons.append("visual_description_changed")

    object_change_ratio = _change_ratio(
        context.objects,
        last_significant_context.objects,
    )
    objects_changed = object_change_ratio >= settings.object_change_threshold
    if objects_changed:
        reasons.append("objects_changed")

    minutes_since_last_llm = None
    if user_state.last_llm_interpretation_at is None:
        reasons.append("no_previous_llm_call")
    else:
        minutes_since_last_llm = minutes_between(
            user_state.last_llm_interpretation_at,
            context.context_timestamp,
        )
        if minutes_since_last_llm >= settings.significance_periodic_minutes:
            reasons.append("periodic_llm_check")

    should_call_llm = bool(reasons)
    reason = reasons[0] if reasons else "duplicate_or_low_signal"

    return SignificanceResult(
        should_call_llm=should_call_llm,
        reason=reason,
        reasons=reasons,
        visual_similarity=visual_similarity,
        keywords_changed=keywords_changed,
        new_audio_keywords=new_audio_keywords,
        transcript_changed=transcript_changed,
        location_changed=location_changed,
        objects_changed=objects_changed,
        object_change_ratio=object_change_ratio,
        minutes_since_last_llm=minutes_since_last_llm,
    )
