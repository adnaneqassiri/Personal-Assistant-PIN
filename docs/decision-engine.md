# Decision Engine MVP

Backend MVP for a multimodal personal assistant Decision Engine.

The Decision Engine consumes context events produced by the Context Builder, filters low-signal events, interprets meaningful context with an LLM, updates user state, applies deterministic rules, builds structured decisions, stores auditable data in MongoDB, publishes selected actions to Kafka, and indexes useful memory in Chroma.

## Project Overview

The Decision Engine is the intelligent backend layer of the assistant. It is not a simple rules engine and it does not let the LLM decide actions directly.

The LLM is used only to interpret context:

- current activity;
- meeting detection;
- break or movement signals;
- short factual summary;
- whether the context is useful for future memory.

The final decision is produced by deterministic backend modules using state, rules, and the LLM interpretation.

Global flow:

```text
Kafka normalized-context
-> Spark Structured Streaming
-> EventProcessor
-> Validation / Normalization
-> Significance Detector
-> Groq LLM interpretation
-> State Manager
-> Meeting Manager
-> Rule Engine
-> Decision Builder
-> MongoDB
-> Kafka decision.actions
-> Chroma vector memory
```

## Architecture

```text
.
├── Decision_engine/
├── context_ingestion/
├── scripts/
├── tests/
├── compose.yaml
├── .env
├── requirements.txt
└── README.md
```

```text
Decision_engine/
├── app/
├── config/
├── kafka/
├── llm/
├── models/
├── pipeline/
├── rules/
├── storage/
├── utils/
└── tests/
```

```text
context_ingestion/
├── producers/
│   ├── audio_producer.py
│   ├── video_producer.py
│   ├── location_producer.py
│   └── run_producers.py
├── builder/
│   └── context_builder.py
├── kafka/
│   └── context_producer.py
├── data/
│   ├── audio/
│   └── video/
├── config.py
├── publish_sample_context.py
└── requirements.txt
```

### `app/`

Application entry points and dependency wiring.

- `bootstrap.py`: builds the real `EventProcessor` with MongoDB, Groq, Chroma, and Kafka producer.
- `main_spark_processor.py`: CLI entry point for the Spark Streaming service.
- `daily_summary_job.py`: batch job that generates and indexes a daily summary.

### `config/`

Settings loaded from environment variables.

### `models/`

Pydantic domain models:

- raw context;
- normalized context;
- LLM interpretation;
- user state;
- rule result;
- decision;
- activity;
- meeting;
- notification;
- daily summary.

### `pipeline/`

Core processing modules:

- context validator;
- context transformer;
- significance detector;
- state manager;
- meeting manager;
- rule engine;
- decision builder;
- event processor.

### `llm/`

LLM abstraction and Groq implementation.

- `base.py`: mockable `LLMClient` interface.
- `prompts.py`: English prompts.
- `json_repair.py`: simple JSON extraction and fallback parsing.
- `groq_client.py`: Groq + LangChain implementation.

### `storage/`

Persistence adapters.

- `repositories.py`: MongoDB repositories behind the processor storage port.
- `mongo_client.py`: MongoDB client helper.
- `chroma_client.py`: Chroma vector memory adapter.

### `kafka/`

Kafka adapters.

- `spark_consumer.py`: Spark Structured Streaming Kafka reader.
- `notification_producer.py`: publisher for selected `decision.actions`.

### `rules/`

Deterministic business rules:

- break reminders;
- hydration reminders;
- meeting intent;
- anti-spam filtering.

### `utils/`

Shared helpers for IDs, text normalization, UTC-aware timestamps, Pydantic compatibility, and logging.

### `tests/`

Unit tests using mocks/fakes for MongoDB, Kafka, Chroma, Spark, and Groq.

## Main Pipeline

For each Kafka event:

1. Save the raw event to `raw_context_events`, even if invalid.
2. Validate required fields and optional modality sections.
3. If invalid, mark the raw event as invalid and stop.
4. Transform the raw event into `NormalizedContext`.
5. Save the normalized context to `normalized_contexts`.
6. Compare with the last significant context using the Significance Detector.
7. If not significant, update `last_seen_at` and stop.
8. Call the LLM for interpretation only.
9. If the LLM fails, use fallback `unknown`.
10. Update user state.
11. Run the Meeting Manager.
12. Run deterministic rules.
13. Build a structured decision.
14. Save enriched `decisions_history`.
15. Save notifications, activities, and meetings as needed.
16. Publish selected actions to `decision.actions`.
17. Index useful memory in Chroma.

Important: the LLM never decides whether to notify, save, publish, or act. It only returns `LLMInterpretation`.

## Input Kafka Event Format

Topic: `normalized-context`

Each message must be a single JSON object, not a list.

```json
{
  "context_id": "ctx_e2e_001",
  "user_id": "user_001",
  "created_at": "2026-04-29T15:00:00Z",
  "vision": {
    "timestamp": "2026-04-29T15:00:00Z",
    "objects": ["laptop", "desk", "bottle"],
    "scene_description": "User is sitting at a desk and working on a laptop with a bottle nearby.",
    "confidence": 0.88,
    "media_ref": "capture_e2e_001.jpg"
  },
  "audio": {
    "timestamp": "2026-04-29T15:00:00Z",
    "transcript": "We need to finish the decision engine MVP today.",
    "keywords": ["decision engine", "mvp", "deadline"],
    "confidence": 0.84,
    "audio_ref": "audio_e2e_001.wav"
  },
  "location": {
    "timestamp": "2026-04-29T15:00:00Z",
    "latitude": 35.7595,
    "longitude": -5.834,
    "place_label": "home",
    "zone_type": "home"
  }
}
```

`vision`, `audio`, and `location` may be absent independently, but `context_id`, `user_id`, and `created_at` are required for a valid event.

## Environment Variables

### `.env.example`

Do not commit real secrets.

```env
GROQ_API_KEY=replace_with_your_groq_api_key

KAFKA_BOOTSTRAP_SERVERS=localhost:29092
CONTEXT_TOPIC=normalized-context
KAFKA_TOPIC=normalized-context
KAFKA_SOURCE_TOPIC=normalized-context
KAFKA_AUTO_OFFSET_RESET=earliest
NOTIFICATION_TOPIC=decision.actions
KAFKA_ACTIONS_TOPIC=decision.actions

AUDIO_STREAM_TOPIC=audio_stream
VIDEO_STREAM_TOPIC=video_stream
LOCATION_STREAM_TOPIC=location_stream
CONTEXT_USER_ID=user_001
CONTEXT_POLL_INTERVAL_SECONDS=15
CONTEXT_BUCKET_SECONDS=15
CONTEXT_WATERMARK_DELAY="30 seconds"
CONTEXT_BUILDER_CHECKPOINT_LOCATION=./checkpoints/context_builder

SPARK_MASTER=local[*]
SPARK_CHECKPOINT_LOCATION=./checkpoints/decision_engine

MONGO_URI=mongodb://admin:admin123@localhost:27017
MONGO_DATABASE=assistant_db

CHROMA_PATH=./chroma

GROQ_MODEL=llama-3.1-8b-instant
LLM_RETRY_COUNT=3

LOG_LEVEL=INFO

SIGNIFICANCE_PERIODIC_MINUTES=2
VISUAL_SIMILARITY_THRESHOLD=0.75
OBJECT_CHANGE_THRESHOLD=0.50
```

### Required variables

- `GROQ_API_KEY`: Groq API key used by the real LLM client.
- `KAFKA_BOOTSTRAP_SERVERS`: Kafka bootstrap address, usually `localhost:29092`.
- `CONTEXT_TOPIC`: normalized context topic, default `normalized-context`.
- `KAFKA_TOPIC`: topic used by `Decision_engine.run_kafka_decision_engine`.
- `KAFKA_SOURCE_TOPIC`: topic used by the full Decision Engine Spark processor.
- `KAFKA_AUTO_OFFSET_RESET`: Spark Kafka starting offset, use `earliest` for local tests with existing messages.
- `NOTIFICATION_TOPIC`: output notification/actions topic.
- `KAFKA_ACTIONS_TOPIC`: existing Decision Engine env name for `NOTIFICATION_TOPIC`.
- `AUDIO_STREAM_TOPIC`, `VIDEO_STREAM_TOPIC`, `LOCATION_STREAM_TOPIC`: internal raw context ingestion topics.
- `CONTEXT_BUILDER_CHECKPOINT_LOCATION`: context builder Spark checkpoint path.
- `SPARK_MASTER`: Spark master used by local scripts.
- `SPARK_CHECKPOINT_LOCATION`: Decision Engine runner checkpoint path.
- `MONGO_URI`: MongoDB URI.
- `MONGO_DATABASE`: MongoDB database name.
- `CHROMA_PATH`: local Chroma persistence path.
- `GROQ_MODEL`: Groq model name.
- `LLM_RETRY_COUNT`: number of LLM call attempts.
- `LOG_LEVEL`: Python logging level, for example `INFO` or `DEBUG`.
- `SIGNIFICANCE_PERIODIC_MINUTES`: periodic LLM call threshold.
- `VISUAL_SIMILARITY_THRESHOLD`: Jaccard threshold for visual description changes.
- `OBJECT_CHANGE_THRESHOLD`: object-set change threshold.

## Runtime And Installation

Python 3.10+ is recommended. The current Python 3.8 environment uses the compatible pins in `requirements.txt`, including `chromadb==0.5.23`, `langchain-core==0.2.43`, `langchain-groq==0.1.10`, and `posthog>=2.4,<4`. Newer ChromaDB 1.x requires Python 3.9+, and newer PostHog 4.x uses Python 3.9+ typing syntax that can crash ChromaDB startup on Python 3.8 with `TypeError: 'type' object is not subscriptable`. The Decision Engine also configures ChromaDB with a local no-op telemetry client so PostHog is not imported during startup.

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Running Locally

Start Kafka and MongoDB:

```bash
docker compose up -d kafka mongodb
```

Run the cleaned pipeline scripts:

```bash
./scripts/run_context_builder.sh
./scripts/run_decision_engine.sh
./scripts/run_all.sh
```

Publish one sample context message:

```bash
python -m context_ingestion.publish_sample_context
```

Verify the Decision Engine consumes and persists a context message:

```bash
./scripts/test_decision_engine_consumes_context.sh
```

Check containers:

```bash
docker ps | grep -E "kafka|mongodb"
```

Create Kafka topics:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka:9092 \
  --create \
  --if-not-exists \
  --topic normalized-context \
  --partitions 1 \
  --replication-factor 1
```

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka:9092 \
  --create \
  --if-not-exists \
  --topic decision.actions \
  --partitions 1 \
  --replication-factor 1
```

Publish a test event:

```bash
cat <<'JSON' | docker exec -i kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka:9092 \
  --topic normalized-context
{"context_id":"ctx_e2e_001","user_id":"user_001","created_at":"2026-04-29T15:00:00Z","vision":{"timestamp":"2026-04-29T15:00:00Z","objects":["laptop","desk","bottle"],"scene_description":"User is sitting at a desk and working on a laptop with a bottle nearby.","confidence":0.88,"media_ref":"capture_e2e_001.jpg"},"audio":{"timestamp":"2026-04-29T15:00:00Z","transcript":"We need to finish the decision engine MVP today.","keywords":["decision engine","mvp","deadline"],"confidence":0.84,"audio_ref":"audio_e2e_001.wav"},"location":{"timestamp":"2026-04-29T15:00:00Z","latitude":35.7595,"longitude":-5.834,"place_label":"home","zone_type":"home"}}
JSON
```

Run the Spark processor:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location /tmp/decision-engine-e2e-checkpoint
```

Run available messages and stop:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --available-now \
  --checkpoint-location /tmp/decision-engine-e2e-checkpoint
```

Read published actions:

```bash
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka:9092 \
  --topic decision.actions \
  --from-beginning \
  --timeout-ms 5000
```

## Testing

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests/unit
```

## Daily Summary Job

Current day:

```bash
python -m Decision_engine.app.daily_summary_job --user-id user_001
```

Yesterday:

```bash
python -m Decision_engine.app.daily_summary_job --user-id user_001 --yesterday
```

Specific date:

```bash
python -m Decision_engine.app.daily_summary_job --user-id user_001 --date 2026-04-25
```

## MongoDB Collections

The MVP uses MongoDB as the source of truth.

Default database: `assistant_db`.

- `raw_context_events`: raw Kafka events, including invalid ones with status and errors.
- `normalized_contexts`: internal normalized context format.
- `user_state`: current derived state per user.
- `activities`: activity updates.
- `meetings`: active and closed meetings with transcript chunks.
- `notifications`: notification records.
- `decisions_history`: enriched decision audit documents.
- `daily_summaries`: generated daily summaries.

Inspect locally:

```bash
docker exec -it mongodb mongosh \
  "mongodb://admin:admin123@localhost:27017/admin"
```

```javascript
use assistant_db

db.raw_context_events.find().pretty()
db.normalized_contexts.find().pretty()
db.user_state.find().pretty()
db.decisions_history.find().pretty()
db.notifications.find().pretty()
db.meetings.find().pretty()
db.daily_summaries.find().pretty()
```

## Vector Memory

Chroma is used for semantic memory. It does not replace MongoDB.

The vector store indexes useful text such as:

- LLM summaries marked as memory-worthy;
- useful context summaries;
- daily summaries.

Raw context events are not indexed. Metadata points back to source data through fields such as:

- `user_id`;
- `source_type`;
- `mongo_collection`;
- `mongo_id`;
- `timestamp`;
- `context_id`;
- `decision_id`.

Local Chroma files are stored under `CHROMA_PATH`, default:

```bash
./chroma
```

## Logs and Observability

Logging uses Python standard `logging`.

Default level:

```bash
LOG_LEVEL=INFO
```

Debug level:

```bash
LOG_LEVEL=DEBUG
```

Example run:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location /tmp/decision-engine-e2e-checkpoint
```

Useful log examples:

```text
INFO Decision_engine.kafka.spark_consumer - Processing Spark batch batch_id=3 message_count=1
INFO Decision_engine.kafka.spark_consumer - Processing Kafka message batch_id=3 row_number=1 context_id=ctx_e2e_001 user_id=user_001
INFO Decision_engine.pipeline.processor - Significance result context_id=ctx_e2e_001 user_id=user_001 should_call_llm=True reason=audio_transcript_changed
INFO Decision_engine.pipeline.processor - LLM completed context_id=ctx_e2e_001 user_id=user_001 activity=working confidence=0.86 memory_worthy=True
INFO Decision_engine.storage.repositories - Mongo save_decision_history decision_id=dec_xxx user_id=user_001 source_context_id=ctx_e2e_001
INFO Decision_engine.kafka.spark_consumer - Processor result batch_id=3 row_number=1 context_id=ctx_e2e_001 status=processed significant=True decision_id=dec_xxx error=None
```

## Current MVP Limitations

- Spark `foreachBatch` uses `collect()`, acceptable for MVP but not production-scale.
- Unit tests use mocks/fakes for MongoDB, Kafka, Chroma, Spark, and Groq.
- No scheduler is included for the daily summary job.
- Anti-spam is simple and based on reminder timestamps in `user_state`.
- Daily summaries use UTC-only date boundaries.
- V1 is focused on `user_001`, although `user_id` is preserved everywhere.
- LLM retries do not include backoff.
- JSON repair is intentionally simple.
- Chroma uses default embedding behavior unless configured externally.

## Next Improvements

- Add Docker integration tests with real Kafka, MongoDB, and Chroma.
- Add a dead-letter Kafka topic for invalid events and runtime failures.
- Add better retry and exponential backoff for LLM calls.
- Add a scheduler for `daily_summary_job`.
- Add metrics for filtered events, LLM calls, decisions, and notifications.
- Replace Spark batch `collect()` with production-ready partition handling.
- Add structured logs or OpenTelemetry tracing.
- Move remaining hard-coded rule thresholds fully into settings.
