import unittest
from datetime import date, datetime, timezone

from Decision_engine.app.daily_summary_job import (
    DailySummaryJob,
    MongoDailySummaryStorage,
    date_bounds_utc,
    parse_date,
)


class FakeStorage(object):
    def __init__(self, daily_context=None, should_raise=False):
        self.daily_context = daily_context or {}
        self.should_raise = should_raise
        self.saved_summaries = []
        self.requested = []

    def get_daily_context(self, user_id, target_date):
        self.requested.append((user_id, target_date))
        if self.should_raise:
            raise RuntimeError("storage unavailable")
        return self.daily_context

    def save_daily_summary(self, summary):
        self.saved_summaries.append(summary)


class FakeLLM(object):
    def __init__(self, should_raise=False):
        self.should_raise = should_raise
        self.contexts = []

    def summarize_day(self, daily_context):
        self.contexts.append(daily_context)
        if self.should_raise:
            raise RuntimeError("llm unavailable")
        return {
            "summary": "The user worked on the decision engine and attended one meeting.",
            "important_events": [
                "Worked on the decision engine",
                "Attended one technical meeting",
            ],
        }


class FakeVectorStore(object):
    def __init__(self):
        self.indexed = []

    def index_memory(self, text, metadata):
        self.indexed.append((text, metadata))


class FakeCollection(object):
    def __init__(self, documents):
        self.documents = list(documents)
        self.last_query = None

    def find(self, query):
        self.last_query = query
        user_id = query["user_id"]
        field_name = [key for key in query.keys() if key != "user_id"][0]
        start = query[field_name]["$gte"]
        end = query[field_name]["$lt"]
        return [
            document
            for document in self.documents
            if document.get("user_id") == user_id
            and start <= document.get(field_name) < end
        ]


class FakeDatabase(object):
    def __init__(self, collections):
        self.collections = collections

    def __getitem__(self, name):
        return self.collections[name]


class DailySummaryJobTest(unittest.TestCase):
    def setUp(self):
        self.target_date = date(2026, 4, 25)
        self.daily_context = {
            "user_id": "user_001",
            "date": "2026-04-25",
            "activities": [
                {"activity_type": "working", "duration_minutes": 120},
                {"activity_type": "break", "duration_minutes": 10},
            ],
            "meetings": [{"meeting_id": "meet_001"}],
            "notifications": [{"notification_id": "notif_001"}],
            "decisions_history": [{"decision_id": "dec_001"}],
        }

    def test_generates_saves_and_indexes_daily_summary(self):
        storage = FakeStorage(self.daily_context)
        llm = FakeLLM()
        vector_store = FakeVectorStore()
        job = DailySummaryJob(storage, llm, vector_store)

        result = job.run_for_user("user_001", self.target_date)

        self.assertEqual(result.status, "processed")
        self.assertEqual(result.summary_id, "daily_2026-04-25_user_001")
        self.assertEqual(storage.requested, [("user_001", self.target_date)])
        self.assertEqual(len(storage.saved_summaries), 1)
        summary = storage.saved_summaries[0]
        self.assertEqual(summary.work_duration_minutes, 120)
        self.assertEqual(summary.meetings_count, 1)
        self.assertEqual(summary.breaks_count, 1)
        self.assertEqual(len(summary.important_events), 2)
        self.assertEqual(len(vector_store.indexed), 1)
        indexed_text, metadata = vector_store.indexed[0]
        self.assertIn("decision engine", indexed_text)
        self.assertEqual(metadata["source_type"], "daily_summary")
        self.assertEqual(metadata["mongo_collection"], "daily_summaries")
        self.assertEqual(metadata["mongo_id"], "daily_2026-04-25_user_001")
        self.assertEqual(metadata["notifications_count"], 1)
        self.assertEqual(metadata["decisions_count"], 1)

    def test_does_not_index_empty_summary(self):
        class EmptyLLM(FakeLLM):
            def summarize_day(self, daily_context):
                return {"summary": "", "important_events": []}

        storage = FakeStorage(self.daily_context)
        vector_store = FakeVectorStore()
        job = DailySummaryJob(storage, EmptyLLM(), vector_store)

        result = job.run_for_user("user_001", self.target_date)

        self.assertEqual(result.status, "processed")
        self.assertEqual(vector_store.indexed, [])

    def test_returns_failed_result_when_llm_fails(self):
        storage = FakeStorage(self.daily_context)
        job = DailySummaryJob(storage, FakeLLM(should_raise=True), FakeVectorStore())

        result = job.run_for_user("user_001", self.target_date)

        self.assertEqual(result.status, "failed")
        self.assertIn("llm unavailable", result.error)
        self.assertEqual(storage.saved_summaries, [])

    def test_date_helpers(self):
        start, end = date_bounds_utc(self.target_date)

        self.assertEqual(start.isoformat(), "2026-04-25T00:00:00+00:00")
        self.assertEqual(end.isoformat(), "2026-04-26T00:00:00+00:00")
        self.assertEqual(parse_date("2026-04-25"), self.target_date)

    def test_mongo_daily_storage_filters_by_date(self):
        inside = datetime(2026, 4, 25, 10, 0, tzinfo=timezone.utc)
        outside = datetime(2026, 4, 26, 10, 0, tzinfo=timezone.utc)
        database = FakeDatabase(
            {
                "activities": FakeCollection(
                    [
                        {"_id": "a1", "user_id": "user_001", "started_at": inside},
                        {"_id": "a2", "user_id": "user_001", "started_at": outside},
                    ]
                ),
                "meetings": FakeCollection(
                    [{"_id": "m1", "user_id": "user_001", "started_at": inside}]
                ),
                "notifications": FakeCollection(
                    [{"_id": "n1", "user_id": "user_001", "timestamp": inside}]
                ),
                "decisions_history": FakeCollection(
                    [{"_id": "d1", "user_id": "user_001", "timestamp": inside}]
                ),
                "daily_summaries": FakeCollection([]),
            }
        )
        storage = MongoDailySummaryStorage(database)

        context = storage.get_daily_context("user_001", self.target_date)

        self.assertEqual(len(context["activities"]), 1)
        self.assertEqual(len(context["meetings"]), 1)
        self.assertEqual(len(context["notifications"]), 1)
        self.assertEqual(len(context["decisions_history"]), 1)
        self.assertNotIn("_id", context["activities"][0])


if __name__ == "__main__":
    unittest.main()
