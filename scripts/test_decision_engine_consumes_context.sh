#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export PYTHONPATH="$ROOT_DIR${PYTHONPATH:+:$PYTHONPATH}"
export KAFKA_BOOTSTRAP_SERVERS="${KAFKA_BOOTSTRAP_SERVERS:-localhost:29092}"
export CONTEXT_TOPIC="${CONTEXT_TOPIC:-normalized-context}"
export KAFKA_SOURCE_TOPIC="${KAFKA_SOURCE_TOPIC:-$CONTEXT_TOPIC}"
export KAFKA_AUTO_OFFSET_RESET="${KAFKA_AUTO_OFFSET_RESET:-earliest}"
export NOTIFICATION_TOPIC="${NOTIFICATION_TOPIC:-decision.actions}"
export KAFKA_ACTIONS_TOPIC="${KAFKA_ACTIONS_TOPIC:-$NOTIFICATION_TOPIC}"
export SPARK_MASTER="${SPARK_MASTER:-local[*]}"
export LOG_LEVEL="${LOG_LEVEL:-INFO}"

LOG_FILE="${LOG_FILE:-/tmp/decision-engine-consume-test.log}"
CHECKPOINT_DIR="${CHECKPOINT_DIR:-/tmp/decision-engine-consume-test-checkpoint}"

rm -rf "$CHECKPOINT_DIR"
: > "$LOG_FILE"

echo "[test] publishing sample context to ${CONTEXT_TOPIC}"
python -m context_ingestion.publish_sample_context

echo "[test] running decision engine once from ${KAFKA_SOURCE_TOPIC}"
python -m Decision_engine.app.main_spark_processor \
  --master "$SPARK_MASTER" \
  --available-now \
  --checkpoint-location "$CHECKPOINT_DIR" 2>&1 | tee "$LOG_FILE"

echo "[test] checking logs in ${LOG_FILE}"
grep -q "Kafka message received" "$LOG_FILE"
grep -q "Kafka message parsed" "$LOG_FILE"
grep -q "Kafka message passes validation" "$LOG_FILE"
grep -q "Decision generated" "$LOG_FILE"
grep -q "Data written to MongoDB" "$LOG_FILE"

echo "[test] Decision Engine consumed and persisted a context message."
