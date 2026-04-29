from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .llm_interpretation import ActivityType


class Activity(BaseModel):
    activity_id: str
    user_id: str
    activity_type: ActivityType
    label: str = ""
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: float = Field(default=0.0, ge=0.0)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source_context_ids: List[str] = Field(default_factory=list)
    summary: str = ""
