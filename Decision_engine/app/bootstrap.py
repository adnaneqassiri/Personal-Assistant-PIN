from Decision_engine.config.settings import Settings, get_settings
from Decision_engine.kafka.notification_producer import NotificationProducer
from Decision_engine.llm.groq_client import GroqLLMClient
from Decision_engine.pipeline.processor import EventProcessor
from Decision_engine.storage.chroma_client import ChromaVectorStore
from Decision_engine.storage.mongo_client import get_database
from Decision_engine.storage.repositories import MongoRepositories
from Decision_engine.utils.logging import configure_logging


def build_processor(
    settings: Settings = None,
    storage=None,
    llm_client=None,
    vector_store=None,
    notification_producer=None,
    database=None,
    mongo_client=None,
    chat_model=None,
    chroma_collection=None,
    kafka_producer=None,
) -> EventProcessor:
    configure_logging()
    settings = settings or get_settings()

    storage = storage or MongoRepositories(
        database or get_database(settings=settings, client=mongo_client)
    )
    llm_client = llm_client or GroqLLMClient(
        chat_model=chat_model,
        settings=settings,
    )
    vector_store = vector_store or ChromaVectorStore(
        collection=chroma_collection,
        settings=settings,
    )
    notification_producer = notification_producer or NotificationProducer(
        producer=kafka_producer,
        settings=settings,
    )

    return EventProcessor(
        storage=storage,
        llm_client=llm_client,
        vector_store=vector_store,
        notification_producer=notification_producer,
    )
