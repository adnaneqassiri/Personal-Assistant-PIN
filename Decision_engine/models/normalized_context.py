from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NormalizedContext(BaseModel):
    context_id: str
    user_id: str
    context_timestamp: datetime

    visual_description: str = ""
    objects: List[str] = Field(default_factory=list)
    vision_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    audio_transcript: str = ""
    audio_keywords: List[str] = Field(default_factory=list)
    audio_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    location_label: Optional[str] = None
    zone_type: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)

    global_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    media_ref: Optional[str] = None
    audio_ref: Optional[str] = None
