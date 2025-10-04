#!/bin/bash
# ExoSeekr Local Research Application Launcher
# Simple script to start the ExoSeekr application for researchers

set -e

echo "ExoSeekr - AI Exoplanet Detection Platform"
echo "==========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "SUCCESS: Docker is running"
echo "STARTING: ExoSeekr application..."
echo ""

# Build and start the application
docker-compose up --build -d

# Wait for services to be healthy
echo "WAITING: For services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "SUCCESS: ExoSeekr is now running!"
    echo ""
    echo "ACCESS: Application endpoints:"
    echo "   Frontend UI: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "MONITOR: Application commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop application: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo ""
    echo "ExoSeekr is ready for exoplanet detection research."
else
    echo "ERROR: Failed to start ExoSeekr. Check the logs with: docker-compose logs"
    exit 1
fi