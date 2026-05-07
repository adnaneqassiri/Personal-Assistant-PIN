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
export KAFKA_TOPIC="${KAFKA_TOPIC:-$CONTEXT_TOPIC}"
export KAFKA_SOURCE_TOPIC="${KAFKA_SOURCE_TOPIC:-$CONTEXT_TOPIC}"
export KAFKA_AUTO_OFFSET_RESET="${KAFKA_AUTO_OFFSET_RESET:-earliest}"
export NOTIFICATION_TOPIC="${NOTIFICATION_TOPIC:-decision.actions}"
export KAFKA_ACTIONS_TOPIC="${KAFKA_ACTIONS_TOPIC:-$NOTIFICATION_TOPIC}"
export SPARK_MASTER="${SPARK_MASTER:-local[*]}"

echo "[decision-engine] bootstrap=${KAFKA_BOOTSTRAP_SERVERS} topic=${KAFKA_SOURCE_TOPIC} offset=${KAFKA_AUTO_OFFSET_RESET}"
python - <<'PY'
from context_ingestion.kafka.topics import ensure_normalized_context_topic

ensure_normalized_context_topic()
PY
args=(
  --master "$SPARK_MASTER"
)

if [ -n "${SPARK_CHECKPOINT_LOCATION:-}" ]; then
  args+=(--checkpoint-location "$SPARK_CHECKPOINT_LOCATION")
fi

python -m Decision_engine.app.main_spark_processor "${args[@]}"
