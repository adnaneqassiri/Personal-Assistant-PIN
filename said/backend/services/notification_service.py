from backend.database.mongo import get_db


def get_notifications_by_user(user_id: str):
    db = get_db()

    notifications = list(
        db.notifications.find({"user_id": user_id}).sort("timestamp", -1)
    )

    for notification in notifications:
        notification["_id"] = str(notification["_id"])

    return notifications


def get_notification_by_context_id(user_id: str, context_id: str):
    db = get_db()

    notification = db.notifications.find_one(
        {
            "user_id": user_id,
            "context_id": context_id
        }
    )

    if notification:
        notification["_id"] = str(notification["_id"])

    return notification