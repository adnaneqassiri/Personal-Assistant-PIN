import os
from functools import lru_cache

from pydantic import BaseModel, Field


class Settings(BaseModel):
    kafka_bootstrap_servers: str = Field(default="localhost:29092")
    kafka_source_topic: str = Field(default="contextBuilder")
    kafka_actions_topic: str = Field(default="decision.actions")

    mongo_uri: str = Field(default="mongodb://admin:admin123@localhost:27017")
    mongo_database: str = Field(default="assistant_db")

    chroma_path: str = Field(default="./chroma")

    groq_model: str = Field(default="llama-3.1-8b-instant")
    llm_retry_count: int = Field(default=3, ge=0)

    timezone: str = Field(default="UTC")

    significance_periodic_minutes: int = Field(default=2, ge=1)
    visual_similarity_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    object_change_threshold: float = Field(default=0.50, ge=0.0, le=1.0)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        kafka_bootstrap_servers=os.getenv(
            "KAFKA_BOOTSTRAP_SERVERS", "localhost:29092"
        ),
        kafka_source_topic=os.getenv("KAFKA_SOURCE_TOPIC", "contextBuilder"),
        kafka_actions_topic=os.getenv("KAFKA_ACTIONS_TOPIC", "decision.actions"),
        mongo_uri=os.getenv("MONGO_URI", "mongodb://admin:admin123@localhost:27017"),
        mongo_database=os.getenv("MONGO_DATABASE", "assistant_db"),
        chroma_path=os.getenv("CHROMA_PATH", "./chroma"),
        groq_model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        llm_retry_count=int(os.getenv("LLM_RETRY_COUNT", "3")),
        timezone=os.getenv("APP_TIMEZONE", "UTC"),
        significance_periodic_minutes=int(
            os.getenv("SIGNIFICANCE_PERIODIC_MINUTES", "2")
        ),
        visual_similarity_threshold=float(
            os.getenv("VISUAL_SIMILARITY_THRESHOLD", "0.75")
        ),
        object_change_threshold=float(os.getenv("OBJECT_CHANGE_THRESHOLD", "0.50")),
    )
