from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VisionContext(BaseModel):
    timestamp: Optional[datetime] = None
    objects: List[str] = Field(default_factory=list)
    scene_description: str = ""
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    media_ref: Optional[str] = None


class AudioContext(BaseModel):
    timestamp: Optional[datetime] = None
    transcript: str = ""
    keywords: List[str] = Field(default_factory=list)
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    audio_ref: Optional[str] = None


class LocationContext(BaseModel):
    timestamp: Optional[datetime] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    place_label: Optional[str] = None
    zone_type: Optional[str] = None


class RawContextEvent(BaseModel):
    context_id: str
    user_id: str
    created_at: datetime
    vision: Optional[VisionContext] = None
    audio: Optional[AudioContext] = None
    location: Optional[LocationContext] = None
