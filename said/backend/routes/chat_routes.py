from fastapi import APIRouter, HTTPException
from backend.schemas.chat_schema import ChatRequest, ChatResponse
from backend.services.chat_service import process_chat_request

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        return process_chat_request(
            user_id=request.user_id,
            question=request.question,
            context_id=request.context_id
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))