import logging
from typing import Any, Dict, Optional

from Decision_engine.models.decision import Action, Decision
from Decision_engine.models.meeting import Meeting
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.processor import StoragePort
from Decision_engine.utils.ids import generate_id
from Decision_engine.utils.pydantic import model_to_dict
from Decision_engine.utils.time import utc_now

logger = logging.getLogger(__name__)


COLLECTION_NAMES = [
    "raw_context_events",
    "normalized_contexts",
    "user_state",
    "activities",
    "meetings",
    "notifications",
    "decisions_history",
    "daily_summaries",
]


class MongoRepositories(StoragePort):
    def __init__(self, database):
        self.db = database
        self.raw_context_events = database["raw_context_events"]
        self.normalized_contexts = database["normalized_contexts"]
        self.user_state = database["user_state"]
        self.activities = database["activities"]
        self.meetings = database["meetings"]
        self.notifications = database["notifications"]
        self.decisions_history = database["decisions_history"]
        self.daily_summaries = database["daily_summaries"]
        self.ensure_indexes()

    def ensure_indexes(self) -> None:
        self.raw_context_events.create_index("raw_event_id", unique=True)
        self.raw_context_events.create_index("context_id")
        self.raw_context_events.create_index("user_id")
        self.raw_context_events.create_index("created_at")
        self.raw_context_events.create_index("status")

        self.normalized_contexts.create_index("context_id", unique=True)
        self.normalized_contexts.create_index("user_id")
        self.normalized_contexts.create_index("context_timestamp")

        self.user_state.create_index("user_id", unique=True)

        self.activities.create_index("activity_id", unique=True)
        self.activities.create_index("user_id")
        self.activities.create_index("started_at")

        self.meetings.create_index("meeting_id", unique=True)
        self.meetings.create_index("user_id")
        self.meetings.create_index("status")
        self.meetings.create_index("started_at")

        self.notifications.create_index("notification_id", unique=True)
        self.notifications.create_index("user_id")
        self.notifications.create_index("timestamp")
        self.notifications.create_index("type")

        self.decisions_history.create_index("decision_id", unique=True)
        self.decisions_history.create_index("user_id")
        self.decisions_history.create_index("timestamp")
        self.decisions_history.create_index("source_context_id")

        self.daily_summaries.create_index("summary_id", unique=True)
        self.daily_summaries.create_index("user_id")
        self.daily_summaries.create_index("date")

    def save_raw_context_event(self, payload: Dict[str, Any], status: str) -> str:
        raw_event_id = generate_id("raw")
        document = dict(payload)
        document.update(
            {
                "raw_event_id": raw_event_id,
                "status": status,
                "received_at": utc_now(),
                "errors": [],
            }
        )
        self.raw_context_events.insert_one(document)
        logger.info(
            "Mongo save_raw_context_event context_id=%s user_id=%s raw_event_id=%s status=%s",
            document.get("context_id"),
            document.get("user_id"),
            raw_event_id,
            status,
        )
        return raw_event_id

    def mark_raw_context_event_invalid(self, raw_event_ref: str, errors) -> None:
        errors_list = list(errors)
        self.raw_context_events.update_one(
            {"raw_event_id": raw_event_ref},
            {
                "$set": {
                    "status": "invalid",
                    "errors": errors_list,
                    "updated_at": utc_now(),
                }
            },
        )
        logger.info(
            "Mongo mark_raw_context_event_invalid raw_event_id=%s errors_count=%s",
            raw_event_ref,
            len(errors_list),
        )

    def save_normalized_context(self, context: NormalizedContext) -> None:
        document = model_to_dict(context)
        self.normalized_contexts.replace_one(
            {"context_id": context.context_id},
            document,
            upsert=True,
        )
        logger.info(
            "Mongo save_normalized_context context_id=%s user_id=%s",
            context.context_id,
            context.user_id,
        )

    def get_user_state(self, user_id: str) -> Optional[UserState]:
        document = self.user_state.find_one({"user_id": user_id})
        if not document:
            return None
        return UserState(**self._strip_mongo_id(document))

    def save_user_state(self, state: UserState) -> None:
        self.user_state.replace_one(
            {"user_id": state.user_id},
            model_to_dict(state),
            upsert=True,
        )
        logger.info(
            "Mongo upsert_user_state user_id=%s current_activity=%s last_seen_at=%s",
            state.user_id,
            state.current_activity,
            state.last_seen_at,
        )

    def get_last_significant_context(
        self, user_id: str
    ) -> Optional[NormalizedContext]:
        state = self.get_user_state(user_id)
        if state is None or not state.last_significant_context_id:
            return None

        document = self.normalized_contexts.find_one(
            {"context_id": state.last_significant_context_id}
        )
        if not document:
            return None
        return NormalizedContext(**self._strip_mongo_id(document))

    def get_active_meeting(
        self, user_id: str, meeting_id: Optional[str]
    ) -> Optional[Meeting]:
        if not meeting_id:
            return None

        document = self.meetings.find_one(
            {"user_id": user_id, "meeting_id": meeting_id, "status": "active"}
        )
        if not document:
            return None
        return Meeting(**self._strip_mongo_id(document))

    def save_decision_history(self, history_document: Dict[str, Any]) -> None:
        document = dict(history_document)
        decision = document.get("decision", {})
        document.update(
            {
                "decision_id": decision.get("decision_id"),
                "user_id": decision.get("user_id"),
                "timestamp": decision.get("timestamp"),
                "source_context_id": decision.get("source_context_id"),
            }
        )
        self.decisions_history.replace_one(
            {"decision_id": document["decision_id"]},
            document,
            upsert=True,
        )
        logger.info(
            "Mongo save_decision_history decision_id=%s user_id=%s source_context_id=%s",
            document.get("decision_id"),
            document.get("user_id"),
            document.get("source_context_id"),
        )

    def save_notification(self, decision: Decision, action: Action) -> None:
        notification_type = action.payload.get("notification_type", "notification")
        document = {
            "notification_id": generate_id("notif"),
            "user_id": decision.user_id,
            "timestamp": decision.timestamp,
            "type": notification_type,
            "message": action.payload.get("message", ""),
            "reason": decision.reason,
            "status": "pending",
            "source_decision_id": decision.decision_id,
            "source_context_id": decision.source_context_id,
            "payload": dict(action.payload),
        }
        self.notifications.insert_one(document)
        logger.info(
            "Mongo save_notification notification_id=%s user_id=%s type=%s decision_id=%s",
            document["notification_id"],
            document["user_id"],
            document["type"],
            document["source_decision_id"],
        )
        self._update_notification_timestamp(
            decision.user_id,
            notification_type,
            decision.timestamp,
        )

    def save_activity_update(self, decision: Decision, action: Action) -> None:
        document = dict(action.payload)
        document.setdefault("activity_id", generate_id("act"))
        document.setdefault("user_id", decision.user_id)
        document.setdefault("source_decision_id", decision.decision_id)
        document.setdefault("source_context_id", decision.source_context_id)
        document.setdefault("timestamp", decision.timestamp)
        self.activities.insert_one(document)

    def save_meeting(self, meeting: Meeting) -> None:
        self.meetings.replace_one(
            {"meeting_id": meeting.meeting_id},
            model_to_dict(meeting),
            upsert=True,
        )

    def _update_notification_timestamp(
        self, user_id: str, notification_type: str, timestamp
    ) -> None:
        field_name = None
        if notification_type == "break_reminder":
            field_name = "last_break_reminder_at"
        elif notification_type == "hydration_reminder":
            field_name = "last_hydration_reminder_at"

        if field_name is None:
            return

        self.user_state.update_one(
            {"user_id": user_id},
            {"$set": {field_name: timestamp}},
            upsert=True,
        )

    def _strip_mongo_id(self, document: Dict[str, Any]) -> Dict[str, Any]:
        clean = dict(document)
        clean.pop("_id", None)
        return clean
