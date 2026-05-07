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

CHECKPOINT_DIR="${CHECKPOINT_DIR:-/tmp/decision-engine-replay-normalized-context}"

echo "[replay] topic=${KAFKA_SOURCE_TOPIC} bootstrap=${KAFKA_BOOTSTRAP_SERVERS} checkpoint=${CHECKPOINT_DIR}"
rm -rf "$CHECKPOINT_DIR"

python -m Decision_engine.app.main_spark_processor \
  --master "$SPARK_MASTER" \
  --available-now \
  --checkpoint-location "$CHECKPOINT_DIR"
