#!/bin/bash
# ExoSeekr Startup Script
# Initializes and starts both backend and frontend with PM2

set -e

echo "Starting ExoSeekr..."

# Create logs directory
mkdir -p /app/logs

# Ensure proper permissions
chmod -R 755 /app/backend
chmod -R 755 /app/frontend

# Wait for any file system operations to complete
sleep 2

# Check if backend virtual environment is working
echo "Checking backend environment..."
cd /app/backend
if [ ! -f "venv/bin/activate" ]; then
    echo "ERROR: Backend virtual environment not found"
    exit 1
fi

# Test Python environment
source venv/bin/activate
python3 -c "import fastapi, uvicorn; print('SUCCESS: Backend dependencies OK')"
deactivate

# Check if frontend dependencies are installed
echo "Checking frontend environment..."
cd /app/frontend
if [ ! -d "node_modules" ]; then
    echo "ERROR: Frontend node_modules not found"
    exit 1
fi

# Test frontend dependencies
pnpm run --version > /dev/null && echo "SUCCESS: Frontend dependencies OK"

# Start PM2 with ecosystem config
echo "Starting PM2 processes..."
cd /app

# Start PM2 daemon if not running
pm2 ping

# Start applications using ecosystem config
pm2 start ecosystem.config.js

# Enable PM2 startup script (for container restarts)
pm2 startup
pm2 save

echo "SUCCESS: ExoSeekr started successfully!"
echo "Backend API: http://localhost:8000"
echo "Frontend UI: http://localhost:3000" 
echo "API Docs: http://localhost:8000/docs"

# Show PM2 status
pm2 status

# Follow logs (this keeps the container running)
echo "Following application logs..."
pm2 logs