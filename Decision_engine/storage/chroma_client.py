from datetime import date, datetime
from typing import Any, Dict, Optional

from Decision_engine.config.settings import Settings, get_settings
from Decision_engine.pipeline.processor import VectorStorePort
from Decision_engine.utils.ids import generate_id
from Decision_engine.utils.time import utc_now


class ChromaVectorStore(VectorStorePort):
    def __init__(
        self,
        collection=None,
        client=None,
        collection_name: str = "assistant_memory",
        settings: Optional[Settings] = None,
    ):
        self.settings = settings or get_settings()
        self.collection_name = collection_name
        self.collection = collection or self._get_collection(client)

    def index_memory(self, text: str, metadata: Dict[str, Any]) -> None:
        if not text or not text.strip():
            return

        metadata = self._build_metadata(metadata or {})
        if self._is_raw_event(metadata):
            return

        vector_id = metadata.get("vector_id") or generate_id("vec")
        metadata["vector_id"] = vector_id

        self.collection.add(
            ids=[vector_id],
            documents=[text],
            metadatas=[metadata],
        )

    def query_memory(self, query: str, user_id: str, n_results: int = 5):
        if not query or not query.strip():
            return []

        return self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"user_id": user_id},
        )

    def _get_collection(self, client=None):
        client = client or self._build_client()
        return client.get_or_create_collection(name=self.collection_name)

    def _build_client(self):
        try:
            import chromadb
        except ImportError as exc:
            raise RuntimeError(
                "chromadb is required for ChromaVectorStore. "
                "Install it with 'pip install chromadb'."
            ) from exc

        return chromadb.PersistentClient(path=self.settings.chroma_path)

    def _build_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        built = dict(metadata)
        built.setdefault("source_type", "memory")
        built.setdefault("mongo_collection", "")
        built.setdefault("mongo_id", "")
        built.setdefault("timestamp", utc_now())
        return self._sanitize_metadata(built)

    def _sanitize_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = {}
        for key, value in metadata.items():
            if value is None:
                sanitized[key] = ""
            elif isinstance(value, (str, int, float, bool)):
                sanitized[key] = value
            elif isinstance(value, (datetime, date)):
                sanitized[key] = value.isoformat()
            else:
                sanitized[key] = str(value)
        return sanitized

    def _is_raw_event(self, metadata: Dict[str, Any]) -> bool:
        return (
            metadata.get("source_type") == "raw_event"
            or metadata.get("mongo_collection") == "raw_context_events"
        )
