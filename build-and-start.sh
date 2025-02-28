#\!/bin/bash
set -e

echo "Building service-a and service-b..."

# Pre-build the apps
docker-compose -f docker-compose-build.yml up service-a-build service-b-build

echo "Building Docker images..."
docker-compose build

echo "Starting services..."
docker-compose up

