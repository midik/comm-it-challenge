#\!/bin/sh
set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ensure reports directory exists
mkdir -p /app/reports

log "Starting services in production mode..."

# Check if we're running service-a or service-b
if [ -f "/app/apps/service-a/dist/apps/service-a/src/main.js" ]; then
  log "Starting service-a..."
  cd /app && node apps/service-a/dist/apps/service-a/src/main.js
elif [ -f "/app/apps/service-b/dist/apps/service-b/src/main.js" ]; then
  log "Starting service-b..."
  cd /app && node apps/service-b/dist/apps/service-b/src/main.js
  # Keep the container running after the initial startup message
  if [ $? -eq 0 ]; then
    while true; do
      sleep 10
      log "Heartbeat"
    done
  fi
else
  log "ERROR: Could not find start script for either service-a or service-b"
  exit 1
fi
