import unittest
from datetime import datetime, timedelta, timezone

from Decision_engine.utils.time import (
    ensure_utc_aware,
    max_datetime,
    minutes_between,
)


class TimeUtilsTest(unittest.TestCase):
    def test_minutes_between_aware_aware(self):
        start = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        end = datetime(2026, 4, 25, 15, 30, tzinfo=timezone.utc)

        self.assertEqual(minutes_between(start, end), 30.0)

    def test_minutes_between_naive_aware(self):
        start = datetime(2026, 4, 25, 15, 0)
        end = datetime(2026, 4, 25, 15, 30, tzinfo=timezone.utc)

        self.assertEqual(minutes_between(start, end), 30.0)

    def test_minutes_between_aware_naive(self):
        start = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)
        end = datetime(2026, 4, 25, 15, 30)

        self.assertEqual(minutes_between(start, end), 30.0)

    def test_minutes_between_naive_naive(self):
        start = datetime(2026, 4, 25, 15, 0)
        end = datetime(2026, 4, 25, 15, 30)

        self.assertEqual(minutes_between(start, end), 30.0)

    def test_minutes_between_iso_z_strings(self):
        self.assertEqual(
            minutes_between(
                "2026-04-25T15:00:00Z",
                "2026-04-25T15:45:00Z",
            ),
            45.0,
        )

    def test_minutes_between_iso_strings_without_timezone(self):
        self.assertEqual(
            minutes_between(
                "2026-04-25T15:00:00",
                "2026-04-25T15:15:00",
            ),
            15.0,
        )

    def test_minutes_between_none_handling(self):
        aware = datetime(2026, 4, 25, 15, 0, tzinfo=timezone.utc)

        self.assertEqual(minutes_between(None, aware), 0.0)
        self.assertEqual(minutes_between(aware, None), 0.0)
        self.assertEqual(minutes_between(None, None), 0.0)

    def test_ensure_utc_aware_assumes_naive_is_utc(self):
        result = ensure_utc_aware(datetime(2026, 4, 25, 15, 0))

        self.assertEqual(result.tzinfo, timezone.utc)
        self.assertEqual(result.isoformat(), "2026-04-25T15:00:00+00:00")

    def test_ensure_utc_aware_converts_offsets_to_utc(self):
        result = ensure_utc_aware("2026-04-25T16:00:00+01:00")

        self.assertEqual(result.isoformat(), "2026-04-25T15:00:00+00:00")

    def test_max_datetime_normalizes_mixed_naive_and_aware(self):
        earlier = datetime(2026, 4, 25, 15, 0)
        later = datetime(2026, 4, 25, 15, 1, tzinfo=timezone.utc)

        self.assertEqual(max_datetime(earlier, later), later)

    def test_minutes_between_never_returns_negative(self):
        start = datetime(2026, 4, 25, 15, 30, tzinfo=timezone.utc)
        end = start - timedelta(minutes=5)

        self.assertEqual(minutes_between(start, end), 0.0)


if __name__ == "__main__":
    unittest.main()
