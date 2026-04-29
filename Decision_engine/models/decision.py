from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

DecisionType = Literal[
    "notification",
    "activity_update",
    "meeting_update",
    "no_action",
]
ActionTarget = Literal["notification_service", "meeting_manager", "activity_tracker"]
ActionType = Literal[
    "notification",
    "activity_update",
    "start_meeting",
    "append_meeting_transcript",
    "close_meeting",
]


class Action(BaseModel):
    type: ActionType
    target: ActionTarget
    payload: Dict[str, Any] = Field(default_factory=dict)


class Decision(BaseModel):
    decision_id: str
    user_id: str
    timestamp: datetime
    decision_type: DecisionType
    should_notify: bool = False
    notification_type: Optional[str] = None
    activity: str = "unknown"
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    reason: str = ""
    rules_triggered: List[str] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)
    source_context_id: str
