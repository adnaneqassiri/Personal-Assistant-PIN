import unittest
from datetime import datetime, timezone

from Decision_engine.models.decision import Action, Decision
from Decision_engine.models.meeting import Meeting
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.storage.repositories import COLLECTION_NAMES, MongoRepositories


class InsertOneResult(object):
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeCollection(object):
    def __init__(self):
        self.documents = []
        self.indexes = []

    def create_index(self, key, **kwargs):
        self.indexes.append((key, kwargs))

    def insert_one(self, document):
        stored = dict(document)
        stored.setdefault("_id", "id_%s" % len(self.documents))
        self.documents.append(stored)
        return InsertOneResult(stored["_id"])

    def replace_one(self, query, document, upsert=False):
        for index, existing in enumerate(self.documents):
            if self._matches(existing, query):
                stored = dict(document)
                stored.setdefault("_id", existing.get("_id"))
                self.documents[index] = stored
                return
        if upsert:
            self.insert_one(document)

    def update_one(self, query, update, upsert=False):
        for existing in self.documents:
            if self._matches(existing, query):
                existing.update(update.get("$set", {}))
                return
        if upsert:
            document = dict(query)
            document.update(update.get("$set", {}))
            self.insert_one(document)

    def find_one(self, query):
        for existing in self.documents:
            if self._matches(existing, query):
                return dict(existing)
        return None

    def _matches(self, document, query):
        for key, value in query.items():
            if document.get(key) != value:
                return False
        return True


class FakeDatabase(object):
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = FakeCollection()
        return self.collections[name]


class MongoRepositoriesTest(unittest.TestCase):
    def setUp(self):
        self.db = FakeDatabase()
        self.repositories = MongoRepositories(self.db)
        self.timestamp = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)

    def test_creates_required_collections_and_indexes(self):
        for name in COLLECTION_NAMES:
            self.assertIn(name, self.db.collections)

        self.assertIn(
            ("context_id", {}),
            self.db["raw_context_events"].indexes,
        )
        self.assertIn(
            ("user_id", {}),
            self.db["normalized_contexts"].indexes,
        )
        self.assertIn(
            ("decision_id", {"unique": True}),
            self.db["decisions_history"].indexes,
        )
        self.assertIn(
            ("meeting_id", {"unique": True}),
            self.db["meetings"].indexes,
        )
        self.assertIn(
            ("notification_id", {"unique": True}),
            self.db["notifications"].indexes,
        )

    def test_raw_invalid_event_is_stored_with_status_and_errors(self):
        raw_ref = self.repositories.save_raw_context_event(
            {"context_id": "ctx_bad", "user_id": "user_001"},
            status="received",
        )
        self.repositories.mark_raw_context_event_invalid(
            raw_ref,
            ["created_at is required"],
        )

        document = self.db["raw_context_events"].find_one({"raw_event_id": raw_ref})

        self.assertEqual(document["status"], "invalid")
        self.assertEqual(document["errors"], ["created_at is required"])

    def test_saves_and_reads_user_state_and_last_significant_context(self):
        context = NormalizedContext(
            context_id="ctx_001",
            user_id="user_001",
            context_timestamp=self.timestamp,
            visual_description="User is working.",
        )
        state = UserState(
            user_id="user_001",
            current_activity="working",
            last_significant_context_id="ctx_001",
        )

        self.repositories.save_normalized_context(context)
        self.repositories.save_user_state(state)

        loaded_state = self.repositories.get_user_state("user_001")
        loaded_context = self.repositories.get_last_significant_context("user_001")

        self.assertEqual(loaded_state.current_activity, "working")
        self.assertEqual(loaded_context.context_id, "ctx_001")
        self.assertEqual(loaded_context.visual_description, "User is working.")

    def test_decisions_history_stores_enriched_document(self):
        decision = Decision(
            decision_id="dec_001",
            user_id="user_001",
            timestamp=self.timestamp,
            decision_type="no_action",
            source_context_id="ctx_001",
        )
        history_document = {
            "decision": self._model_to_dict(decision),
            "significance_result": {"should_call_llm": True},
            "llm_interpretation": {"activity": "working"},
            "state_snapshot": {"current_activity": "working"},
            "rule_results": [],
            "meeting_result": None,
        }

        self.repositories.save_decision_history(history_document)

        stored = self.db["decisions_history"].find_one({"decision_id": "dec_001"})

        self.assertEqual(stored["decision"]["decision_id"], "dec_001")
        self.assertEqual(stored["user_id"], "user_001")
        self.assertIn("significance_result", stored)
        self.assertIn("state_snapshot", stored)

    def test_save_notification_inserts_document_and_updates_user_state_timestamp(self):
        state = UserState(user_id="user_001")
        self.repositories.save_user_state(state)
        decision = Decision(
            decision_id="dec_001",
            user_id="user_001",
            timestamp=self.timestamp,
            decision_type="notification",
            should_notify=True,
            notification_type="break_reminder",
            reason="Break reminder is due.",
            source_context_id="ctx_001",
        )
        action = Action(
            type="notification",
            target="notification_service",
            payload={
                "notification_type": "break_reminder",
                "message": "Take a short break.",
            },
        )

        self.repositories.save_notification(decision, action)

        notification = self.db["notifications"].documents[0]
        updated_state = self.repositories.get_user_state("user_001")

        self.assertEqual(notification["type"], "break_reminder")
        self.assertEqual(notification["status"], "pending")
        self.assertEqual(updated_state.last_break_reminder_at, self.timestamp)

    def test_save_and_load_active_meeting(self):
        meeting = Meeting(
            meeting_id="meet_001",
            user_id="user_001",
            started_at=self.timestamp,
        )

        self.repositories.save_meeting(meeting)
        loaded = self.repositories.get_active_meeting("user_001", "meet_001")

        self.assertEqual(loaded.meeting_id, "meet_001")
        self.assertEqual(loaded.status, "active")

    def _model_to_dict(self, model):
        if hasattr(model, "model_dump"):
            return model.model_dump(mode="python")
        return model.dict()


if __name__ == "__main__":
    unittest.main()
