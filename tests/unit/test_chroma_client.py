import unittest
from datetime import datetime, timezone

from Decision_engine.storage.chroma_client import ChromaVectorStore


class FakeChromaCollection(object):
    def __init__(self):
        self.add_calls = []
        self.query_calls = []

    def add(self, ids, documents, metadatas):
        self.add_calls.append(
            {
                "ids": ids,
                "documents": documents,
                "metadatas": metadatas,
            }
        )

    def query(self, query_texts, n_results, where):
        self.query_calls.append(
            {
                "query_texts": query_texts,
                "n_results": n_results,
                "where": where,
            }
        )
        return {"documents": [["memory result"]], "metadatas": [[where]]}


class ChromaVectorStoreTest(unittest.TestCase):
    def setUp(self):
        self.collection = FakeChromaCollection()
        self.store = ChromaVectorStore(collection=self.collection)
        self.timestamp = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)

    def test_indexes_memory_with_required_metadata(self):
        self.store.index_memory(
            "User worked on the decision engine.",
            {
                "user_id": "user_001",
                "source_type": "activity_summary",
                "mongo_collection": "activities",
                "mongo_id": "act_001",
                "timestamp": self.timestamp,
            },
        )

        self.assertEqual(len(self.collection.add_calls), 1)
        call = self.collection.add_calls[0]
        metadata = call["metadatas"][0]

        self.assertEqual(call["documents"], ["User worked on the decision engine."])
        self.assertEqual(metadata["user_id"], "user_001")
        self.assertEqual(metadata["source_type"], "activity_summary")
        self.assertEqual(metadata["mongo_collection"], "activities")
        self.assertEqual(metadata["mongo_id"], "act_001")
        self.assertEqual(metadata["timestamp"], "2026-04-25T15:00:00+00:00")
        self.assertTrue(metadata["vector_id"].startswith("vec_"))

    def test_does_not_index_empty_text(self):
        self.store.index_memory("", {"user_id": "user_001"})

        self.assertEqual(self.collection.add_calls, [])

    def test_does_not_index_raw_events(self):
        self.store.index_memory(
            "Raw event should not be indexed.",
            {
                "user_id": "user_001",
                "source_type": "raw_event",
                "mongo_collection": "raw_context_events",
                "mongo_id": "raw_001",
            },
        )

        self.assertEqual(self.collection.add_calls, [])

    def test_query_memory_filters_by_user_id(self):
        result = self.store.query_memory("decision engine", "user_001", n_results=3)

        self.assertEqual(len(self.collection.query_calls), 1)
        call = self.collection.query_calls[0]
        self.assertEqual(call["query_texts"], ["decision engine"])
        self.assertEqual(call["n_results"], 3)
        self.assertEqual(call["where"], {"user_id": "user_001"})
        self.assertEqual(result["documents"], [["memory result"]])

    def test_empty_query_returns_empty_list(self):
        result = self.store.query_memory("   ", "user_001")

        self.assertEqual(result, [])
        self.assertEqual(self.collection.query_calls, [])


if __name__ == "__main__":
    unittest.main()
