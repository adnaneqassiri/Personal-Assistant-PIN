import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
AUDIO_DATA_DIR = DATA_DIR / "audio"
VIDEO_DATA_DIR = DATA_DIR / "video"

load_dotenv(PROJECT_ROOT / ".env")

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
CONTEXT_TOPIC = os.getenv("CONTEXT_TOPIC", "normalized-context")
CONTEXT_USER_ID = os.getenv("CONTEXT_USER_ID", "user_001")

AUDIO_STREAM_TOPIC = os.getenv("AUDIO_STREAM_TOPIC", "audio_stream")
VIDEO_STREAM_TOPIC = os.getenv("VIDEO_STREAM_TOPIC", "video_stream")
LOCATION_STREAM_TOPIC = os.getenv("LOCATION_STREAM_TOPIC", "location_stream")

POLL_INTERVAL_SECONDS = int(os.getenv("CONTEXT_POLL_INTERVAL_SECONDS", "15"))
CONTEXT_BUILDER_CHECKPOINT_LOCATION = os.getenv(
    "CONTEXT_BUILDER_CHECKPOINT_LOCATION",
    "/tmp/context-builder-checkpoint",
)
CONTEXT_BUCKET_SECONDS = int(os.getenv("CONTEXT_BUCKET_SECONDS", "15"))
CONTEXT_WATERMARK_DELAY = os.getenv("CONTEXT_WATERMARK_DELAY", "30 seconds")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
