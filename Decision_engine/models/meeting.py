from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


MeetingStatus = Literal["active", "closed"]


class TranscriptChunk(BaseModel):
    timestamp: datetime
    text: str
    source_context_id: Optional[str] = None


class Meeting(BaseModel):
    meeting_id: str
    user_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: MeetingStatus = "active"
    transcript_chunks: List[TranscriptChunk] = Field(default_factory=list)
    summary: Optional[str] = None
    source_context_ids: List[str] = Field(default_factory=list)
