#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  cat <<USAGE
Usage: $0 <command>

Commands:
  validator    Start local Solana validator (port 8899)
  worker       Start Workers API with local D1 (port 8787)
  frontend     Start Next.js dev server (port 3000)
  db:init      Initialize local D1 tables
  all          Start validator + worker + frontend
  help         Show this message

Each service runs in the foreground in its own terminal.
"all" runs all three in background with unified cleanup.

Examples:
  $0 db:init     # first time: create local D1 tables
  $0 worker      # start API only
  $0 frontend    # start UI only (API must be running)
USAGE
}

case "${1:-help}" in
  validator)
    echo "Starting Solana validator on localhost:8899..."
    cd "$ROOT_DIR"
    solana-test-validator
    ;;

  worker)
    echo "Starting Workers API on localhost:8787..."
    cd "$ROOT_DIR/workers"
    pnpm dev
    ;;

  frontend)
    echo "Starting frontend on localhost:3000..."
    cd "$ROOT_DIR"
    pnpm dev
    ;;

  db:init)
    echo "Initializing local D1 database..."
    cd "$ROOT_DIR/workers"
    pnpm db:local
    echo "Done."
    ;;

  db:migrate)
    echo "Running migrations..."
    cd "$ROOT_DIR/workers"
    pnpm db:migrate
    echo "Done."
    ;;

  db:reset)
    echo "Resetting local D1 database..."
    rm -rf "$ROOT_DIR/workers/.wrangler/state/v3/d1"
    cd "$ROOT_DIR/workers"
    pnpm db:local
    echo "Done."
    ;;

  all)
    echo "Starting all services..."
    echo "  Validator  → localhost:8899"
    echo "  Worker     → localhost:8787"
    echo "  Frontend   → localhost:3000"
    echo ""

    cleanup() {
      echo ""
      echo "Shutting down..."
      kill $VALIDATOR_PID $WORKER_PID $FRONTEND_PID 2>/dev/null
      wait 2>/dev/null
      echo "All stopped."
    }
    trap cleanup INT TERM

    cd "$ROOT_DIR"
    solana-test-validator &>/tmp/solana-validator.log &
    VALIDATOR_PID=$!
    echo "  [validator] PID $VALIDATOR_PID"

    cd "$ROOT_DIR/workers"
    pnpm dev &>/tmp/worker.log &
    WORKER_PID=$!
    echo "  [worker]    PID $WORKER_PID"

    cd "$ROOT_DIR"
    pnpm dev &>/tmp/frontend.log &
    FRONTEND_PID=$!
    echo "  [frontend]  PID $FRONTEND_PID"

    echo ""
    echo "All running. Ctrl+C to stop."
    echo "Logs: /tmp/{solana-validator,worker,frontend}.log"
    wait
    ;;

  *)
    usage
    ;;
esac
