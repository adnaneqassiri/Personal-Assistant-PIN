from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    user_id: str = Field(..., example="said")
    question: str = Field(..., example="Qu'est-ce que j'ai fait aujourd'hui ?")
    context_id: Optional[str] = Field(None, example="ctx_001")


class ChatResponse(BaseModel):
    status: str
    answer: str
    intent: str
    context_id: str