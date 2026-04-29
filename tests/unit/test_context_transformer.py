import unittest

from Decision_engine.pipeline.context_transformer import transform_context
from Decision_engine.pipeline.context_validator import validate_raw_context


class ContextTransformerTest(unittest.TestCase):
    def _valid_raw_context(self, payload):
        result = validate_raw_context(payload)
        self.assertTrue(result.is_valid, result.errors)
        return result.raw_context

    def test_transforms_full_context_to_internal_shape(self):
        raw_context = self._valid_raw_context(
            {
                "context_id": "ctx_001",
                "user_id": "user_001",
                "created_at": "2026-04-25T15:00:00Z",
                "vision": {
                    "timestamp": "2026-04-25T15:00:03Z",
                    "objects": ["Computer", "desk", "computer"],
                    "scene_description": "  User   is working at a desk. ",
                    "confidence": 0.9,
                    "media_ref": "capture_1000.jpg",
                },
                "audio": {
                    "timestamp": "2026-04-25T15:00:02Z",
                    "transcript": "  Finish   the decision engine. ",
                    "keywords": ["Decision Engine", "MVP", "mvp"],
                    "confidence": 0.7,
                    "audio_ref": "audio_1500.wav",
                },
                "location": {
                    "timestamp": "2026-04-25T15:00:01Z",
                    "latitude": 35.7595,
                    "longitude": -5.834,
                    "place_label": " home ",
                    "zone_type": " home ",
                },
            }
        )

        normalized = transform_context(raw_context)

        self.assertEqual(normalized.context_id, "ctx_001")
        self.assertEqual(normalized.user_id, "user_001")
        self.assertEqual(normalized.context_timestamp.isoformat(), "2026-04-25T15:00:03+00:00")
        self.assertEqual(normalized.visual_description, "User is working at a desk.")
        self.assertEqual(normalized.objects, ["computer", "desk"])
        self.assertEqual(normalized.audio_transcript, "Finish the decision engine.")
        self.assertEqual(normalized.audio_keywords, ["decision engine", "mvp"])
        self.assertEqual(normalized.location_label, "home")
        self.assertEqual(normalized.zone_type, "home")
        self.assertEqual(normalized.global_confidence, 0.8)
        self.assertEqual(normalized.media_ref, "capture_1000.jpg")
        self.assertEqual(normalized.audio_ref, "audio_1500.wav")

    def test_transforms_context_with_missing_modalities(self):
        raw_context = self._valid_raw_context(
            {
                "context_id": "ctx_002",
                "user_id": "user_001",
                "created_at": "2026-04-25T15:00:00Z",
                "audio": {
                    "timestamp": "2026-04-25T15:01:00Z",
                    "transcript": "Meeting starts now.",
                    "keywords": ["meeting"],
                    "confidence": 0.6,
                    "audio_ref": "audio_1501.wav",
                },
            }
        )

        normalized = transform_context(raw_context)

        self.assertEqual(normalized.context_timestamp.isoformat(), "2026-04-25T15:01:00+00:00")
        self.assertEqual(normalized.visual_description, "")
        self.assertEqual(normalized.objects, [])
        self.assertIsNone(normalized.vision_confidence)
        self.assertEqual(normalized.audio_transcript, "Meeting starts now.")
        self.assertEqual(normalized.audio_keywords, ["meeting"])
        self.assertEqual(normalized.global_confidence, 0.6)
        self.assertIsNone(normalized.location_label)

    def test_global_confidence_defaults_to_zero_without_confidences(self):
        raw_context = self._valid_raw_context(
            {
                "context_id": "ctx_003",
                "user_id": "user_001",
                "created_at": "2026-04-25T15:00:00Z",
            }
        )

        normalized = transform_context(raw_context)

        self.assertEqual(normalized.global_confidence, 0.0)


if __name__ == "__main__":
    unittest.main()
