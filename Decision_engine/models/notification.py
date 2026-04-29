from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


NotificationStatus = Literal["pending", "sent", "ignored", "failed"]


class Notification(BaseModel):
    notification_id: str
    user_id: str
    timestamp: datetime
    type: str
    message: str
    reason: str = ""
    status: NotificationStatus = "pending"
    source_decision_id: Optional[str] = None
