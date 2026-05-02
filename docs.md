# Decision Engine - Practical Guide

This document explains how to run, test, inspect, and extend the Decision Engine.
It is written for local development and uses only features implemented in this repository.

## 1. How to Run the Project

### Prerequisites

- Python 3.8 or newer. Python 3.8 is the target runtime mentioned by the project README.
- Docker and Docker Compose.
- A Groq API key in your environment when you run the real Decision Engine.
- Java available locally for PySpark.

Check your tools:

```bash
python --version
docker --version
docker compose version
java -version
```

### Install Dependencies

From the project root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Start Kafka and MongoDB

Start only the services required by the Decision Engine:

```bash
docker compose up -d kafka mongodb
```

Check that both containers are running:

```bash
docker ps --filter name=kafka --filter name=mongodb
```

Optional UI services:

```bash
docker compose up -d kafka-ui mongo-express
```

- Kafka UI: `http://localhost:8090`
- Mongo Express: `http://localhost:8082`

### Create Kafka Topics

The compose file enables Kafka auto topic creation, but creating topics explicitly makes local tests easier to debug.

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic contextBuilder \
  --partitions 1 \
  --replication-factor 1
```

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic decision.actions \
  --partitions 1 \
  --replication-factor 1
```

List topics:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

### Configure Environment Variables

The project reads environment variables with `os.getenv`. It does not automatically load `.env`.
Create a local `.env` file using the example below, then export it before running the app.
Never commit real API keys.

### `.env.example`

```env
GROQ_API_KEY=replace_with_your_groq_api_key

KAFKA_BOOTSTRAP_SERVERS=localhost:29092
KAFKA_SOURCE_TOPIC=contextBuilder
KAFKA_ACTIONS_TOPIC=decision.actions

MONGO_URI=mongodb://admin:admin123@localhost:27017
MONGO_DATABASE=assistant_db

CHROMA_PATH=./chroma

GROQ_MODEL=llama-3.1-8b-instant
LLM_RETRY_COUNT=3

LOG_LEVEL=INFO

APP_TIMEZONE=UTC
SIGNIFICANCE_PERIODIC_MINUTES=2
VISUAL_SIMILARITY_THRESHOLD=0.75
OBJECT_CHANGE_THRESHOLD=0.50
```

Export the variables:

```bash
set -a
source .env
set +a
```

### Run the Decision Engine with Spark

Run the Spark Structured Streaming entry point:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location ./checkpoints/decision-engine-local
```

This process keeps running and waits for new Kafka messages.

For local Spark mode, the default master is `local[*]`.
You can also pass it explicitly:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --master 'local[*]' \
  --checkpoint-location ./checkpoints/decision-engine-local
```

Important: `Decision_engine/kafka/spark_consumer.py` uses `startingOffsets="latest"`.
For an end-to-end test, start Spark first, then publish Kafka messages.

## 2. How to Test the System

### Run Unit Tests

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests/unit
```

The unit tests use mocks and fakes for MongoDB, Kafka, Chroma, Spark, and Groq.
They do not require Docker services or a real Groq API call.

### End-to-End Test

Use three terminals.

#### Terminal 1: Start Infrastructure

```bash
docker compose up -d kafka mongodb
```

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic contextBuilder \
  --partitions 1 \
  --replication-factor 1
```

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic decision.actions \
  --partitions 1 \
  --replication-factor 1
```

#### Terminal 2: Start Spark

Load environment variables first:

```bash
set -a
source .env
set +a
```

Start the Decision Engine:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location ./checkpoints/decision-engine-e2e
```

Wait until you see a log similar to:

```text
Starting Spark streaming source_topic=contextBuilder actions_topic=decision.actions checkpoint=./checkpoints/decision-engine-e2e once=False
```

#### Terminal 3: Publish One Kafka Message

Kafka messages must be a single JSON object.
Do not send a JSON list.

Complete formatted event:

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

Copy-paste command:

```bash
printf '%s\n' '{"context_id":"ctx_e2e_001","user_id":"user_001","created_at":"2026-04-29T15:00:00Z","vision":{"timestamp":"2026-04-29T15:00:00Z","objects":["laptop","desk","bottle"],"scene_description":"User is sitting at a desk and working on a laptop with a bottle nearby.","confidence":0.88,"media_ref":"capture_e2e_001.jpg"},"audio":{"timestamp":"2026-04-29T15:00:00Z","transcript":"We need to finish the decision engine MVP today.","keywords":["decision engine","mvp","deadline"],"confidence":0.84,"audio_ref":"audio_e2e_001.wav"},"location":{"timestamp":"2026-04-29T15:00:00Z","latitude":35.7595,"longitude":-5.834,"place_label":"home","zone_type":"home"}}' | docker exec -i kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic contextBuilder
```

### What You Should Observe

In the Spark logs, you should see messages like:

```text
Processing Kafka message batch_id=... row_number=... context_id=ctx_e2e_001 user_id=user_001
Significance result context_id=ctx_e2e_001 user_id=user_001 should_call_llm=True reason=no_last_significant_context
LLM completed context_id=ctx_e2e_001 user_id=user_001 activity=...
Decision saved context_id=ctx_e2e_001 user_id=user_001 decision_id=... decision_type=... actions_count=...
```

In MongoDB, the event should appear in:

- `raw_context_events`
- `normalized_contexts`
- `user_state`
- `decisions_history`

Depending on the LLM interpretation and deterministic rules, you may also see documents in:

- `notifications`
- `activities`
- `meetings`

If a publishable action is produced, it is sent to the `decision.actions` Kafka topic.
Read that topic with:

```bash
docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic decision.actions \
  --from-beginning
```

## 3. How to Add a New Rule

### Where Rules Live

Rules are in:

```text
Decision_engine/rules/
```

Current implemented rules include:

- `break_rule.py`
- `hydration_rule.py`
- `meeting_rule.py`
- `anti_spam_rule.py`

The rule engine is in:

```text
Decision_engine/pipeline/rule_engine.py
```

### Rule Structure

Every rule extends `Rule` and implements `evaluate()`.

Base interface:

```python
class Rule(ABC):
    rule_name = "base_rule"

    @abstractmethod
    def evaluate(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        state: UserState,
    ) -> RuleResult:
        raise NotImplementedError
```

The method receives:

- `context`: normalized event data.
- `interpretation`: LLM interpretation of the context.
- `state`: current user state.

It returns a `RuleResult`.

### Example: Hydration Rule

`Decision_engine/rules/hydration_rule.py` triggers only when:

- the activity is not `break`, `rest`, or `unknown`;
- the current session is longer than 90 minutes;
- a hydration reminder was not sent in the last 90 minutes.

Simplified example:

```python
from Decision_engine.models.rule_result import RuleResult
from Decision_engine.rules.base import Rule


class HydrationReminderRule(Rule):
    rule_name = "hydration_reminder_rule"

    def evaluate(self, context, interpretation, state):
        if interpretation.activity in ("break", "rest", "unknown"):
            return RuleResult(rule_name=self.rule_name)

        if state.current_session_duration_minutes <= 90:
            return RuleResult(rule_name=self.rule_name)

        return RuleResult(
            rule_name=self.rule_name,
            triggered=True,
            priority="low",
            action_type="send_notification",
            reason="User has been active for more than 90 minutes without a recent hydration reminder.",
            payload={
                "notification_type": "hydration_reminder",
                "message": "Remember to drink some water.",
            },
        )
```

### Connect the Rule in `rule_engine.py`

Import your rule:

```python
from Decision_engine.rules.my_new_rule import MyNewRule
```

Add it to the default rule list:

```python
self.rules = rules or [
    BreakReminderRule(),
    HydrationReminderRule(),
    MeetingRule(),
    MyNewRule(),
]
```

Keep in mind that `AntiSpamRule` runs after the regular rules and can block notification results.

### Test the Rule

Add or update tests in:

```text
tests/unit/test_rule_engine.py
```

Run:

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest tests.unit.test_rule_engine
```

Run all unit tests before finishing:

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests/unit
```

## 4. How to Read Logs

### Enable Logs

Logging uses Python standard `logging`.
The level is controlled with `LOG_LEVEL`.

Common values:

```bash
LOG_LEVEL=INFO
LOG_LEVEL=DEBUG
```

Run Spark with logs:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location ./checkpoints/decision-engine-local
```

Use debug logs when you need more detail:

```bash
LOG_LEVEL=DEBUG python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location ./checkpoints/decision-engine-debug
```

### Important Log Lines

When Spark receives a Kafka row:

```text
Processing Kafka message batch_id=... row_number=... context_id=... user_id=...
```

When the significance detector decides whether to call the LLM:

```text
Significance result context_id=... user_id=... should_call_llm=... reason=... reasons=...
```

When the LLM returns an interpretation:

```text
LLM completed context_id=... user_id=... activity=... confidence=... memory_worthy=...
```

When a decision is saved:

```text
Decision saved context_id=... user_id=... decision_id=... decision_type=... actions_count=...
```

When an action is published:

```text
Action published decision_id=... context_id=... action_type=...
```

### Diagnose Problems with Logs

If there is no `Processing Kafka message` log:

- Spark is not receiving messages from Kafka.
- Check that Spark was started before publishing the message.
- Check the topic name: `contextBuilder`.
- Check `KAFKA_BOOTSTRAP_SERVERS=localhost:29092`.

If you see `Failed to parse Kafka message`:

- The Kafka value is not valid JSON.
- The Kafka value is a JSON list instead of one JSON object.
- Send exactly one JSON object per Kafka message.

If you see `Validation result ... is_valid=False`:

- The payload is missing `context_id`, `user_id`, or `created_at`.
- One of the timestamps is invalid.
- A section such as `vision`, `audio`, or `location` is present but not an object.

If you see `Significance result ... should_call_llm=False`:

- The event was stored as raw and normalized.
- The event was considered duplicate or low-signal.
- The processor updates `last_seen_at` and stops before calling the LLM.

If you see an LLM error:

- Check that `GROQ_API_KEY` is exported.
- Check internet access.
- Check `GROQ_MODEL`.
- The processor falls back to `unknown` if LLM interpretation fails after retries.

## 5. How to Check MongoDB

### Open `mongosh`

```bash
docker exec -it mongodb mongosh \
  "mongodb://admin:admin123@localhost:27017/assistant_db?authSource=admin"
```

### Important Collections

```text
raw_context_events
normalized_contexts
user_state
decisions_history
notifications
```

Other implemented collections:

```text
activities
meetings
daily_summaries
```

### Useful Queries

Show collections:

```javascript
show collections
```

Count documents:

```javascript
db.raw_context_events.countDocuments()
db.normalized_contexts.countDocuments()
db.user_state.countDocuments()
db.decisions_history.countDocuments()
db.notifications.countDocuments()
```

Find the raw event:

```javascript
db.raw_context_events.find({ context_id: "ctx_e2e_001" }).pretty()
```

Find the normalized context:

```javascript
db.normalized_contexts.find({ context_id: "ctx_e2e_001" }).pretty()
```

Find the user state:

```javascript
db.user_state.find({ user_id: "user_001" }).pretty()
```

Find the decision created from an event:

```javascript
db.decisions_history.find({ source_context_id: "ctx_e2e_001" }).pretty()
```

Find notifications created from an event:

```javascript
db.notifications.find({ source_context_id: "ctx_e2e_001" }).pretty()
```

### Check Whether an Event Was Processed

Run these queries in order:

```javascript
db.raw_context_events.find({ context_id: "ctx_e2e_001" }, { context_id: 1, user_id: 1, status: 1, errors: 1 }).pretty()
```

Expected for a valid received event:

```text
status: "received"
errors: []
```

Check normalization:

```javascript
db.normalized_contexts.find({ context_id: "ctx_e2e_001" }).pretty()
```

If this is empty, the event did not pass validation.

Check decision history:

```javascript
db.decisions_history.find({ source_context_id: "ctx_e2e_001" }).pretty()
```

If this is empty but `normalized_contexts` contains the event, the event was probably considered not significant.
Confirm with the Spark log line:

```text
Significance result ... should_call_llm=False
```

## 6. Troubleshooting

### Kafka Does Not Receive Messages

Check containers:

```bash
docker ps --filter name=kafka
```

Check topics:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

Publish a simple valid event:

```bash
printf '%s\n' '{"context_id":"ctx_ping_001","user_id":"user_001","created_at":"2026-04-29T15:00:00Z"}' | docker exec -i kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic contextBuilder
```

Read the topic:

```bash
docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic contextBuilder \
  --from-beginning \
  --max-messages 1
```

### Spark Processes Nothing

The implemented Spark reader uses:

```python
.option("startingOffsets", "latest")
```

That means Spark reads messages published after the streaming query starts.

Use this order:

1. Start Kafka and MongoDB.
2. Start Spark.
3. Publish the Kafka event.

If you published first, publish a new message with a new `context_id`.

### MongoDB Is Empty

Check that MongoDB is running:

```bash
docker ps --filter name=mongodb
```

Check that the app points to the local MongoDB container:

```bash
echo "$MONGO_URI"
echo "$MONGO_DATABASE"
```

Expected local values:

```text
mongodb://admin:admin123@localhost:27017
assistant_db
```

Check Spark logs for:

```text
Mongo save_raw_context_event
Mongo save_normalized_context
Mongo save_decision_history
```

If `raw_context_events` has a document with `status: "invalid"`, inspect the `errors` field.

### Checkpoint Problems

Spark checkpoints store streaming progress.
If you reuse a checkpoint, Spark may skip messages it already processed.

For a fresh local test, use a new checkpoint path:

```bash
LOG_LEVEL=INFO python -m Decision_engine.app.main_spark_processor \
  --checkpoint-location ./checkpoints/decision-engine-e2e-fresh
```

If you intentionally want to restart from a clean checkpoint, stop Spark and remove only the test checkpoint directory you created:

```bash
rm -rf ./checkpoints/decision-engine-e2e-fresh
```

Do not delete production checkpoints unless you understand the replay impact.

### `startingOffsets` Confusion

This project currently hardcodes `startingOffsets="latest"` in `Decision_engine/kafka/spark_consumer.py`.

Practical impact:

- Messages already in Kafka before Spark starts are not read by a new streaming query.
- For end-to-end tests, always publish after Spark starts.
- If nothing happens, send another event with a new `context_id`.

### Groq API Key Is Missing

If `GROQ_API_KEY` is not exported, the real processor cannot create `GroqLLMClient`.

Check:

```bash
echo "$GROQ_API_KEY"
```

Load your `.env`:

```bash
set -a
source .env
set +a
```

Use a placeholder only in documentation. Use your real key only in your local environment.

## Quick Summary

This guide covers the complete local workflow for the Decision Engine:

- install Python dependencies;
- start Kafka and MongoDB with Docker Compose;
- create Kafka topics;
- configure environment variables safely;
- run the Spark streaming processor;
- publish a valid Kafka JSON event;
- verify processing through logs, MongoDB, and the `decision.actions` topic;
- add and test deterministic rules;
- diagnose common Kafka, Spark, MongoDB, checkpoint, and `startingOffsets` issues.
