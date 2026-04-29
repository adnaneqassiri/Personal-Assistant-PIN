from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.raw_context import RawContextEvent
from Decision_engine.utils.text import average_available, clean_text, normalize_terms
from Decision_engine.utils.time import max_datetime


def transform_context(raw_context: RawContextEvent) -> NormalizedContext:
    vision = raw_context.vision
    audio = raw_context.audio
    location = raw_context.location

    vision_timestamp = vision.timestamp if vision else None
    audio_timestamp = audio.timestamp if audio else None
    location_timestamp = location.timestamp if location else None

    context_timestamp = max_datetime(
        raw_context.created_at,
        vision_timestamp,
        audio_timestamp,
        location_timestamp,
    )

    vision_confidence = vision.confidence if vision else None
    audio_confidence = audio.confidence if audio else None

    return NormalizedContext(
        context_id=raw_context.context_id,
        user_id=raw_context.user_id,
        context_timestamp=context_timestamp,
        visual_description=clean_text(vision.scene_description if vision else ""),
        objects=normalize_terms(vision.objects if vision else []),
        vision_confidence=vision_confidence,
        audio_transcript=clean_text(audio.transcript if audio else ""),
        audio_keywords=normalize_terms(audio.keywords if audio else []),
        audio_confidence=audio_confidence,
        location_label=clean_text(location.place_label) if location else None,
        zone_type=clean_text(location.zone_type) if location else None,
        latitude=location.latitude if location else None,
        longitude=location.longitude if location else None,
        global_confidence=average_available([vision_confidence, audio_confidence]),
        media_ref=vision.media_ref if vision else None,
        audio_ref=audio.audio_ref if audio else None,
    )
