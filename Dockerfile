# ExoSeekr Multi-Service Dockerfile
# Uses PM2 to manage both FastAPI backend and Next.js frontend

# Use Node.js as base image (needed for pnpm and PM2)
FROM node:20-bullseye

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2 pnpm

# Set working directory
WORKDIR /app

# Create directories
RUN mkdir -p /app/backend /app/frontend /app/models /app/data

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt /app/backend/
RUN cd /app/backend && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

# Copy frontend package files and install Node.js dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml /app/frontend/
RUN cd /app/frontend && pnpm install --frozen-lockfile

# Copy application code
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Build Next.js application for production
RUN cd /app/frontend && pnpm run build

# Copy PM2 ecosystem configuration
COPY ecosystem.config.js /app/

# Create a startup script
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health && curl -f http://localhost:3000

# Start PM2 with ecosystem config
CMD ["/app/start.sh"]