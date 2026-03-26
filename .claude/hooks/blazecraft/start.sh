#!/bin/bash
#
# BlazeCraft Aggregator daemon manager.
#
# Usage:
#   ./start.sh         Start aggregator (background)
#   ./start.sh stop    Stop aggregator
#   ./start.sh status  Check if running
#   ./start.sh logs    Tail logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.aggregator.pid"
LOG_FILE="$SCRIPT_DIR/aggregator.log"

start() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "Aggregator already running (PID: $pid)"
      return 0
    fi
    rm "$PID_FILE"
  fi

  # Ensure dependencies installed
  if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$SCRIPT_DIR" && npm install --silent
  fi

  echo "Starting BlazeCraft aggregator..."
  nohup node "$SCRIPT_DIR/aggregator.js" >> "$LOG_FILE" 2>&1 &
  local pid=$!
  echo $pid > "$PID_FILE"
  sleep 1

  if kill -0 "$pid" 2>/dev/null; then
    echo "Aggregator started (PID: $pid)"
    echo "  Events: http://localhost:7777/event"
    echo "  WebSocket: ws://localhost:7778"
  else
    echo "Failed to start aggregator. Check logs: $LOG_FILE"
    rm -f "$PID_FILE"
    return 1
  fi
}

stop() {
  if [ ! -f "$PID_FILE" ]; then
    echo "Aggregator not running (no PID file)"
    return 0
  fi

  local pid=$(cat "$PID_FILE")
  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping aggregator (PID: $pid)..."
    kill "$pid"
    rm "$PID_FILE"
    echo "Stopped"
  else
    echo "Aggregator not running (stale PID file)"
    rm "$PID_FILE"
  fi
}

status() {
  if [ ! -f "$PID_FILE" ]; then
    echo "Aggregator: stopped"
    return 1
  fi

  local pid=$(cat "$PID_FILE")
  if kill -0 "$pid" 2>/dev/null; then
    echo "Aggregator: running (PID: $pid)"
    # Check health endpoint
    if curl -s http://localhost:7777/health > /dev/null 2>&1; then
      echo "  HTTP: OK"
    else
      echo "  HTTP: not responding"
    fi
    return 0
  else
    echo "Aggregator: stopped (stale PID)"
    rm "$PID_FILE"
    return 1
  fi
}

logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -f "$LOG_FILE"
  else
    echo "No log file found"
  fi
}

case "${1:-start}" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    sleep 1
    start
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
