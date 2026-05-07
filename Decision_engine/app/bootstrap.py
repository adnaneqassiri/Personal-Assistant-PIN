import logging
from urllib.parse import urlsplit, urlunsplit

from Decision_engine.config.settings import Settings, get_settings
from Decision_engine.kafka.notification_producer import NotificationProducer
from Decision_engine.llm.groq_client import GroqLLMClient
from Decision_engine.pipeline.processor import EventProcessor
from Decision_engine.storage.chroma_client import ChromaVectorStore
from Decision_engine.storage.mongo_client import get_database
from Decision_engine.storage.repositories import COLLECTION_NAMES, MongoRepositories
from Decision_engine.utils.logging import configure_logging


logger = logging.getLogger(__name__)


def _mask_mongo_uri(uri: str) -> str:
    parsed = urlsplit(uri)
    if not parsed.username:
        return uri

    hostname = parsed.hostname or ""
    netloc = hostname
    if parsed.port:
        netloc = "%s:%s" % (netloc, parsed.port)
    return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))


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
    logger.info(
        "Decision Engine startup kafka_bootstrap_servers=%s consumed_topic=%s auto_offset_reset=%s notification_topic=%s",
        settings.kafka_bootstrap_servers,
        settings.kafka_source_topic,
        settings.kafka_auto_offset_reset,
        settings.kafka_actions_topic,
    )
    logger.info(
        "Decision Engine startup mongo_uri=%s mongo_database=%s mongo_collections=%s",
        _mask_mongo_uri(settings.mongo_uri),
        settings.mongo_database,
        COLLECTION_NAMES,
    )
    logger.info(
        "Decision Engine startup chroma_path=%s",
        settings.chroma_path,
    )

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
