import os
import json
from typing import List, Dict, Any, Literal

from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


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


llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    api_key=os.environ["GROQ_API_KEY"]
)

structured_llm = llm.with_structured_output(DecisionOutput)

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("user", USER_PROMPT_TEMPLATE),
])

chain = prompt | structured_llm


def decide_activity(context: dict) -> dict:
    context_json = json.dumps(context, ensure_ascii=False, indent=2)

    decision: DecisionOutput = chain.invoke({
        "context_json": context_json
    })

    return decision.model_dump()