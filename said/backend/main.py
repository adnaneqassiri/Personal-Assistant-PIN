from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.mongo import get_db
from backend.routes.chat_routes import router as chat_router

app = FastAPI(
    title="AI Life Companion Backend",
    description="Backend avec MongoDB et Groq LLM pour assistant personnel contextuel multimodal",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/")
def root():
    return {
        "message": "AI Life Companion Backend is running"
    }


@app.get("/test-db")
def test_db():
    db = get_db()
    return {
        "database": db.name,
        "collections": db.list_collection_names()
    }


@app.get("/contexts/{user_id}")
def get_user_contexts(user_id: str):
    db = get_db()

    contexts = list(
        db.contexts.find({"user_id": user_id}).sort("created_at", 1)
    )

    for context in contexts:
        context["_id"] = str(context["_id"])

    return {
        "user_id": user_id,
        "contexts": contexts
    }


@app.get("/decisions/{user_id}")
def get_user_decisions(user_id: str):
    db = get_db()

    decisions = list(
        db.decisions.find({"user_id": user_id}).sort("created_at", 1)
    )

    for decision in decisions:
        decision["_id"] = str(decision["_id"])

    return {
        "user_id": user_id,
        "decisions": decisions
    }


@app.get("/notifications/{user_id}")
def get_user_notifications(user_id: str):
    db = get_db()

    notifications = list(
        db.notifications.find({"user_id": user_id}).sort("timestamp", -1)
    )

    for notification in notifications:
        notification["_id"] = str(notification["_id"])

    return {
        "user_id": user_id,
        "notifications": notifications
    }


@app.get("/responses/{user_id}")
def get_user_responses(user_id: str):
    db = get_db()

    responses = list(
        db.llm_responses.find({"user_id": user_id}).sort("timestamp", -1)
    )

    for response in responses:
        response["_id"] = str(response["_id"])

    return {
        "user_id": user_id,
        "responses": responses
    }