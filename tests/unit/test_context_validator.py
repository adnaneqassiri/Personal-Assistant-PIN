import unittest
from datetime import timezone

from Decision_engine.pipeline.context_validator import validate_raw_context


class ContextValidatorTest(unittest.TestCase):
    def test_valid_full_context(self):
        result = validate_raw_context(
            {
                "context_id": "ctx_001",
                "user_id": "user_001",
                "created_at": "2026-04-25T15:00:05+01:00",
                "vision": {
                    "timestamp": "2026-04-25T15:00:00+01:00",
                    "objects": ["computer", "desk"],
                    "scene_description": "User is working.",
                    "confidence": 0.86,
                    "media_ref": "capture_1000.jpg",
                },
                "audio": {
                    "timestamp": "2026-04-25T15:00:01+01:00",
                    "transcript": "We need to finish the MVP.",
                    "keywords": ["MVP"],
                    "confidence": 0.8,
                    "audio_ref": "audio_1500.wav",
                },
                "location": {
                    "timestamp": "2026-04-25T15:00:02+01:00",
                    "latitude": 35.7595,
                    "longitude": -5.834,
                    "place_label": "home",
                    "zone_type": "home",
                },
            }
        )

        self.assertTrue(result.is_valid)
        self.assertEqual(result.errors, [])
        self.assertIsNotNone(result.raw_context)
        self.assertEqual(result.raw_context.created_at.tzinfo, timezone.utc)
        self.assertEqual(result.raw_context.created_at.hour, 14)

    def test_valid_when_modalities_are_missing(self):
        result = validate_raw_context(
            {
                "context_id": "ctx_002",
                "user_id": "user_001",
                "created_at": "2026-04-25T15:00:05Z",
            }
        )

        self.assertTrue(result.is_valid)
        self.assertIsNone(result.raw_context.vision)
        self.assertIsNone(result.raw_context.audio)
        self.assertIsNone(result.raw_context.location)

    def test_invalid_when_required_fields_are_missing(self):
        result = validate_raw_context({"context_id": "ctx_003"})

        self.assertFalse(result.is_valid)
        self.assertIn("user_id is required", result.errors)
        self.assertIn("created_at is required", result.errors)

    def test_invalid_when_timestamp_is_malformed(self):
        result = validate_raw_context(
            {
                "context_id": "ctx_004",
                "user_id": "user_001",
                "created_at": "not-a-date",
            }
        )

        self.assertFalse(result.is_valid)
        self.assertTrue(any("created_at is invalid" in error for error in result.errors))

    def test_invalid_when_modality_is_not_an_object(self):
        result = validate_raw_context(
            {
                "context_id": "ctx_005",
                "user_id": "user_001",
                "created_at": "2026-04-25T15:00:05Z",
                "vision": "bad-vision-payload",
            }
        )

        self.assertFalse(result.is_valid)
        self.assertIn("vision must be an object when provided", result.errors)


if __name__ == "__main__":
    unittest.main()
