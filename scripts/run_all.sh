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

pids=()

cleanup() {
  echo
  echo "[run-all] stopping services..."
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "[run-all] starting context builder"
"$ROOT_DIR/scripts/run_context_builder.sh" &
pids+=("$!")

echo "[run-all] starting decision engine"
"$ROOT_DIR/scripts/run_decision_engine.sh" &
pids+=("$!")

echo "[run-all] running. Press Ctrl+C to stop."
wait
