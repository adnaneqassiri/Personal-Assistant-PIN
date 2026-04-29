from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .llm_interpretation import ActivityType


class UserState(BaseModel):
    user_id: str
    current_activity: ActivityType = "unknown"
    activity_started_at: Optional[datetime] = None
    last_activity_detected_at: Optional[datetime] = None
    last_work_detected_at: Optional[datetime] = None
    current_session_duration_minutes: float = Field(default=0.0, ge=0.0)

    last_llm_interpretation_at: Optional[datetime] = None
    last_significant_context_id: Optional[str] = None
    last_significant_visual_description: str = ""
    last_significant_audio_keywords: List[str] = Field(default_factory=list)
    last_significant_location_label: Optional[str] = None
    last_seen_at: Optional[datetime] = None

    last_break_at: Optional[datetime] = None
    last_break_reminder_at: Optional[datetime] = None
    last_hydration_reminder_at: Optional[datetime] = None

    in_meeting: bool = False
    active_meeting_id: Optional[str] = None
