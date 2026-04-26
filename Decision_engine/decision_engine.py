import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Literal

from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


def _load_project_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


_load_project_env()


class Action(BaseModel):
    type: Literal[
        "save_event",
        "send_notification",
        "generate_meeting_summary",
        "update_activity_session",
        "index_vector_memory"
    ]
    target: Literal[
        "mongodb",
        "notification_service",
        "llm",
        "vectordb"
    ]
    payload: Dict[str, Any] = Field(default_factory=dict)


class MongoDBPayload(BaseModel):
    collection: Literal["context_events"]
    document: Dict[str, Any]


class VectorMetadata(BaseModel):
    context_id: str
    event_type: str


class VectorPayload(BaseModel):
    should_index: bool
    text: str
    metadata: VectorMetadata


class DecisionOutput(BaseModel):
    decision_id: str
    context_id: str
    user_id: str
    detected_activity: Literal[
        "travail_sur_ordinateur",
        "reunion",
        "pause",
        "deplacement",
        "hydratation",
        "repos",
        "activite_inconnue"
    ]
    event_type: Literal[
        "time_optimization",
        "hydration_reminder",
        "meeting_detected",
        "contextual_question_support",
        "normal_context",
        "unknown_event"
    ]
    priority: Literal["low", "medium", "high"]
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    recommendation: str
    action_required: bool
    actions: List[Action]
    mongodb_payload: MongoDBPayload
    vector_payload: VectorPayload


groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to the project .env file or run "
        "'export GROQ_API_KEY=your_key' before starting the decision engine."
    )


llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    api_key=groq_api_key
)

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("user", USER_PROMPT_TEMPLATE),
])


def _extract_json_object(raw_text: str) -> Dict[str, Any]:
    if isinstance(raw_text, dict):
        return raw_text

    if isinstance(raw_text, list):
        chunks = []
        for item in raw_text:
            if isinstance(item, str):
                chunks.append(item)
            elif isinstance(item, dict):
                if isinstance(item.get("text"), str):
                    chunks.append(item["text"])
                else:
                    chunks.append(json.dumps(item, ensure_ascii=False))
            else:
                chunks.append(str(item))
        raw_text = "\n".join(chunks)

    if not isinstance(raw_text, str):
        raw_text = str(raw_text)

    text = raw_text.strip()

    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError(f"No JSON object found in model response: {raw_text}")

    return json.loads(text[start:end + 1])


def decide_activity(context: dict) -> dict:
    context_json = json.dumps(context, ensure_ascii=False, indent=2)
    payload = {"context_json": context_json}
    messages = prompt.format_messages(**payload)
    last_error = None

    for attempt in range(3):
        try:
            raw_response = llm.invoke(messages)
            parsed_response = _extract_json_object(raw_response.content)
            decision = DecisionOutput.model_validate(parsed_response)
            break
        except Exception as exc:
            last_error = exc
            error_text = str(exc)
            if "429" in error_text:
                wait_seconds = attempt + 1
                print(
                    f"[Decision Engine] Groq rate limit hit for context "
                    f"{context.get('context_id', 'unknown')}. Retrying in "
                    f"{wait_seconds}s..."
                )
                time.sleep(wait_seconds)
                continue
            raise
    else:
        raise RuntimeError(
            "Decision engine failed after retries for context "
            f"{context.get('context_id', 'unknown')}: {last_error}"
        ) from last_error

    return decision.model_dump()
