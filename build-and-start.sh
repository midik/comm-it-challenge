#\!/bin/bash
set -e

echo "Building microservices with production settings..."

# Build the Docker images
echo "=> Building Docker images..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache

# Start the services
echo "=> Starting microservices..."
docker-compose up -d

echo "Services are now running"
