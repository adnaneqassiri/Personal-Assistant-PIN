import argparse
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel

from Decision_engine.config.settings import get_settings
from Decision_engine.llm.groq_client import GroqLLMClient
from Decision_engine.models.daily_summary import DailySummary
from Decision_engine.storage.chroma_client import ChromaVectorStore
from Decision_engine.storage.mongo_client import get_database
from Decision_engine.utils.pydantic import model_to_dict


class DailySummaryJobResult(BaseModel):
    status: str
    user_id: str
    date: date
    summary_id: Optional[str] = None
    error: Optional[str] = None


class MongoDailySummaryStorage(object):
    def __init__(self, database):
        self.db = database
        self.activities = database["activities"]
        self.meetings = database["meetings"]
        self.notifications = database["notifications"]
        self.decisions_history = database["decisions_history"]
        self.daily_summaries = database["daily_summaries"]

    def get_daily_context(self, user_id: str, target_date: date) -> Dict[str, Any]:
        start, end = date_bounds_utc(target_date)
        return {
            "user_id": user_id,
            "date": target_date.isoformat(),
            "activities": self._find_between(
                self.activities,
                user_id,
                "started_at",
                start,
                end,
            ),
            "meetings": self._find_between(
                self.meetings,
                user_id,
                "started_at",
                start,
                end,
            ),
            "notifications": self._find_between(
                self.notifications,
                user_id,
                "timestamp",
                start,
                end,
            ),
            "decisions_history": self._find_between(
                self.decisions_history,
                user_id,
                "timestamp",
                start,
                end,
            ),
        }

    def save_daily_summary(self, summary: DailySummary) -> None:
        self.daily_summaries.replace_one(
            {"summary_id": summary.summary_id},
            model_to_dict(summary),
            upsert=True,
        )

    def _find_between(self, collection, user_id, field_name, start, end):
        cursor = collection.find(
            {
                "user_id": user_id,
                field_name: {"$gte": start, "$lt": end},
            }
        )
        return [self._strip_mongo_id(document) for document in cursor]

    def _strip_mongo_id(self, document):
        clean = dict(document)
        clean.pop("_id", None)
        return clean


class DailySummaryJob(object):
    def __init__(self, storage, llm_client, vector_store):
        self.storage = storage
        self.llm_client = llm_client
        self.vector_store = vector_store

    def run_for_user(
        self,
        user_id: str,
        target_date: Optional[date] = None,
    ) -> DailySummaryJobResult:
        target_date = target_date or date.today()

        try:
            daily_context = self.storage.get_daily_context(user_id, target_date)
            summary_payload = self.llm_client.summarize_day(daily_context)
            summary = self._build_summary(user_id, target_date, daily_context, summary_payload)
            self.storage.save_daily_summary(summary)
            self._index_summary(summary, daily_context)

            return DailySummaryJobResult(
                status="processed",
                user_id=user_id,
                date=target_date,
                summary_id=summary.summary_id,
            )
        except Exception as exc:
            return DailySummaryJobResult(
                status="failed",
                user_id=user_id,
                date=target_date,
                error=str(exc),
            )

    def _build_summary(
        self,
        user_id: str,
        target_date: date,
        daily_context: Dict[str, Any],
        summary_payload: Dict[str, Any],
    ) -> DailySummary:
        return DailySummary(
            summary_id="daily_%s_%s" % (target_date.isoformat(), user_id),
            user_id=user_id,
            date=target_date,
            work_duration_minutes=self._work_duration_minutes(daily_context),
            meetings_count=len(daily_context.get("meetings", [])),
            breaks_count=self._breaks_count(daily_context),
            summary=str(summary_payload.get("summary", "")),
            important_events=list(summary_payload.get("important_events", [])),
        )

    def _work_duration_minutes(self, daily_context: Dict[str, Any]) -> float:
        total = 0.0
        for activity in daily_context.get("activities", []):
            if activity.get("activity_type") == "working":
                total += float(activity.get("duration_minutes") or 0.0)
        return total

    def _breaks_count(self, daily_context: Dict[str, Any]) -> int:
        return sum(
            1
            for activity in daily_context.get("activities", [])
            if activity.get("activity_type") == "break"
        )

    def _index_summary(self, summary: DailySummary, daily_context: Dict[str, Any]) -> None:
        if not summary.summary.strip():
            return

        self.vector_store.index_memory(
            summary.summary,
            {
                "user_id": summary.user_id,
                "source_type": "daily_summary",
                "mongo_collection": "daily_summaries",
                "mongo_id": summary.summary_id,
                "timestamp": summary.date.isoformat(),
                "date": summary.date.isoformat(),
                "work_duration_minutes": summary.work_duration_minutes,
                "meetings_count": summary.meetings_count,
                "breaks_count": summary.breaks_count,
                "notifications_count": len(daily_context.get("notifications", [])),
                "decisions_count": len(daily_context.get("decisions_history", [])),
            },
        )


def date_bounds_utc(target_date: date):
    start = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    return start, end


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_args():
    parser = argparse.ArgumentParser(description="Generate a daily summary.")
    parser.add_argument("--user-id", default="user_001")
    parser.add_argument("--date", default=None, help="Target date in YYYY-MM-DD.")
    parser.add_argument(
        "--yesterday",
        action="store_true",
        help="Generate summary for yesterday instead of today.",
    )
    return parser.parse_args()


def build_job():
    settings = get_settings()
    database = get_database(settings=settings)
    return DailySummaryJob(
        storage=MongoDailySummaryStorage(database),
        llm_client=GroqLLMClient(settings=settings),
        vector_store=ChromaVectorStore(settings=settings),
    )


def main() -> None:
    args = parse_args()
    if args.date:
        target_date = parse_date(args.date)
    elif args.yesterday:
        target_date = date.today() - timedelta(days=1)
    else:
        target_date = date.today()

    result = build_job().run_for_user(args.user_id, target_date)
    print(result.json())


if __name__ == "__main__":
    main()
