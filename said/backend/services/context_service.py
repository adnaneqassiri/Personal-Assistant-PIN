from backend.database.mongo import get_db


def clean_mongo_document(document):
    if document and "_id" in document:
        document["_id"] = str(document["_id"])
    return document


def get_latest_context(user_id: str):
    db = get_db()

    context = db.contexts.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )

    return clean_mongo_document(context)


def get_context_by_id(user_id: str, context_id: str):
    db = get_db()

    context = db.contexts.find_one(
        {
            "user_id": user_id,
            "context_id": context_id
        }
    )

    return clean_mongo_document(context)


def get_all_contexts(user_id: str):
    db = get_db()

    contexts = list(
        db.contexts.find({"user_id": user_id}).sort("created_at", 1)
    )

    for context in contexts:
        context["_id"] = str(context["_id"])

    return contexts