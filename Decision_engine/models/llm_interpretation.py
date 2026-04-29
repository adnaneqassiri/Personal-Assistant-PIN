from typing import List, Literal

from pydantic import BaseModel, Field


ActivityType = Literal[
    "working",
    "meeting",
    "break",
    "movement",
    "hydration",
    "rest",
    "unknown",
]

ImportanceLevel = Literal["low", "medium", "high"]


class LLMInterpretation(BaseModel):
    activity: ActivityType = "unknown"
    activity_label: str = "unknown"
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    meeting_detected: bool = False
    is_break: bool = False
    is_movement: bool = False
    summary: str = ""
    signals: List[str] = Field(default_factory=list)
    importance: ImportanceLevel = "low"
    memory_worthy: bool = False
