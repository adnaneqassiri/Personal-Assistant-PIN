from datetime import date
from typing import List

from pydantic import BaseModel, Field


class DailySummary(BaseModel):
    summary_id: str
    user_id: str
    date: date
    work_duration_minutes: float = Field(default=0.0, ge=0.0)
    meetings_count: int = Field(default=0, ge=0)
    breaks_count: int = Field(default=0, ge=0)
    summary: str = ""
    important_events: List[str] = Field(default_factory=list)
