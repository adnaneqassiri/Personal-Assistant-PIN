from Decision_engine.config.settings import Settings, get_settings


def create_mongo_client(settings: Settings = None):
    settings = settings or get_settings()
    try:
        from pymongo import MongoClient
    except ImportError as exc:
        raise RuntimeError(
            "pymongo is required for MongoDB storage. Install it with "
            "'pip install pymongo'."
        ) from exc

    return MongoClient(settings.mongo_uri)


def get_database(settings: Settings = None, client=None):
    settings = settings or get_settings()
    client = client or create_mongo_client(settings)
    return client[settings.mongo_database]
