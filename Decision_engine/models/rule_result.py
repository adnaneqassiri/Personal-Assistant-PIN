from typing import Any, Dict, Literal

from pydantic import BaseModel, Field


RulePriority = Literal["low", "medium", "high"]
RuleActionType = Literal[
    "none",
    "send_notification",
    "start_meeting",
    "append_meeting_transcript",
    "close_meeting",
    "save_activity",
]


class RuleResult(BaseModel):
    rule_name: str
    triggered: bool = False
    priority: RulePriority = "low"
    action_type: RuleActionType = "none"
    reason: str = ""
    payload: Dict[str, Any] = Field(default_factory=dict)
