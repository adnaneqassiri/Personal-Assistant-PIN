import unittest
from datetime import datetime, timezone

from Decision_engine.config.settings import Settings
from Decision_engine.llm.groq_client import GroqLLMClient
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState


class FakeResponse(object):
    def __init__(self, content):
        self.content = content


class FakeChatModel(object):
    def __init__(self, responses=None, failures_before_success=0):
        self.responses = list(responses or [])
        self.failures_before_success = failures_before_success
        self.prompts = []

    def invoke(self, prompt):
        self.prompts.append(prompt)
        if self.failures_before_success > 0:
            self.failures_before_success -= 1
            raise RuntimeError("temporary provider error")
        if self.responses:
            return self.responses.pop(0)
        return FakeResponse(
            """
            {
              "activity": "working",
              "activity_label": "desk work",
              "confidence": 0.8,
              "meeting_detected": false,
              "is_break": false,
              "is_movement": false,
              "summary": "The user is working at a desk.",
              "signals": ["laptop visible"],
              "importance": "medium",
              "memory_worthy": true
            }
            """
        )


class FakeLogger(object):
    def __init__(self):
        self.warnings = []

    def warning(self, *args):
        self.warnings.append(args)


class GroqLLMClientTest(unittest.TestCase):
    def setUp(self):
        self.timestamp = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        self.context = NormalizedContext(
            context_id="ctx_001",
            user_id="user_001",
            context_timestamp=self.timestamp,
            visual_description="User is working at a desk.",
            objects=["laptop", "desk"],
            audio_transcript="We need to finish the decision engine.",
            audio_keywords=["decision engine"],
        )
        self.state = UserState(user_id="user_001", current_activity="working")
        self.settings = Settings(llm_retry_count=3)

    def test_interprets_valid_json_response(self):
        chat_model = FakeChatModel()
        client = GroqLLMClient(
            chat_model=chat_model,
            settings=self.settings,
            logger_instance=FakeLogger(),
        )

        result = client.interpret_context(self.context, self.state)

        self.assertEqual(result.activity, "working")
        self.assertEqual(result.confidence, 0.8)
        self.assertTrue(result.memory_worthy)
        self.assertEqual(len(chat_model.prompts), 1)
        self.assertIn("Your only task is to interpret context", chat_model.prompts[0])
        self.assertIn('"context_id": "ctx_001"', chat_model.prompts[0])

    def test_repairs_broken_json_response(self):
        chat_model = FakeChatModel(
            responses=[
                FakeResponse(
                    """
                    ```json
                    {
                      'activity': 'meeting',
                      'activity_label': 'technical meeting',
                      'confidence': 0.82,
                      'meeting_detected': True,
                      'is_break': False,
                      'is_movement': False,
                      'summary': 'A technical meeting is happening.',
                      'signals': ['technical terms'],
                      'importance': 'high',
                      'memory_worthy': True,
                    }
                    ```
                    """
                )
            ]
        )
        client = GroqLLMClient(
            chat_model=chat_model,
            settings=self.settings,
            logger_instance=FakeLogger(),
        )

        result = client.interpret_context(self.context, self.state)

        self.assertEqual(result.activity, "meeting")
        self.assertTrue(result.meeting_detected)
        self.assertEqual(result.importance, "high")

    def test_returns_fallback_and_logs_when_parsing_is_impossible(self):
        logger = FakeLogger()
        chat_model = FakeChatModel(responses=[FakeResponse("not json")])
        client = GroqLLMClient(
            chat_model=chat_model,
            settings=self.settings,
            logger_instance=logger,
        )

        result = client.interpret_context(self.context, self.state)

        self.assertEqual(result.activity, "unknown")
        self.assertEqual(result.confidence, 0.0)
        self.assertIsNotNone(client.last_error)
        self.assertEqual(len(logger.warnings), 1)

    def test_retries_provider_errors_then_succeeds(self):
        chat_model = FakeChatModel(failures_before_success=2)
        client = GroqLLMClient(
            chat_model=chat_model,
            settings=self.settings,
            logger_instance=FakeLogger(),
        )

        result = client.interpret_context(self.context, self.state)

        self.assertEqual(result.activity, "working")
        self.assertEqual(len(chat_model.prompts), 3)

    def test_returns_fallback_after_retry_exhaustion(self):
        logger = FakeLogger()
        chat_model = FakeChatModel(failures_before_success=5)
        client = GroqLLMClient(
            chat_model=chat_model,
            settings=Settings(llm_retry_count=2),
            logger_instance=logger,
        )

        result = client.interpret_context(self.context, self.state)

        self.assertEqual(result.activity, "unknown")
        self.assertIn("after retries", result.summary)
        self.assertEqual(len(chat_model.prompts), 2)
        self.assertEqual(len(logger.warnings), 2)

    def test_summarize_day_returns_summary_payload(self):
        chat_model = FakeChatModel(
            responses=[
                FakeResponse(
                    """
                    {
                      "summary": "The user worked on the decision engine.",
                      "important_events": ["Implemented the daily summary job"]
                    }
                    """
                )
            ]
        )
        client = GroqLLMClient(
            chat_model=chat_model,
            settings=self.settings,
            logger_instance=FakeLogger(),
        )

        result = client.summarize_day(
            {
                "user_id": "user_001",
                "date": "2026-04-25",
                "activities": [],
                "meetings": [],
            }
        )

        self.assertEqual(result["summary"], "The user worked on the decision engine.")
        self.assertEqual(
            result["important_events"],
            ["Implemented the daily summary job"],
        )
        self.assertIn("You are summarizing one day", chat_model.prompts[0])


if __name__ == "__main__":
    unittest.main()
