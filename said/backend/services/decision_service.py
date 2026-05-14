from backend.database.mongo import get_db


def clean_mongo_document(document):
    if document and "_id" in document:
        document["_id"] = str(document["_id"])
    return document


def get_decision_by_context_id(user_id: str, context_id: str):
    db = get_db()

    decision = db.decisions.find_one(
        {
            "user_id": user_id,
            "context_id": context_id
        }
    )

    return clean_mongo_document(decision)



def get_all_decisions(user_id: str):
    db = get_db()

    decisions = list(
        db.decisions.find({"user_id": user_id}).sort("created_at", 1)
    )

    for decision in decisions:
        decision["_id"] = str(decision["_id"])

    return decisions