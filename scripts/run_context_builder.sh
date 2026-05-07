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

echo "[context-builder] bootstrap=${KAFKA_BOOTSTRAP_SERVERS} topic=${CONTEXT_TOPIC}"
python -m context_ingestion.kafka.topics
python -m context_ingestion.builder.context_builder
