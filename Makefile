# ExoSeekr Docker Management
.PHONY: help build start run stop clean logs shell status restart

# Default target
help:
	@echo "ExoSeekr Docker Commands"
	@echo "=========================="
	@echo "start    - Start ExoSeekr application (background)"
	@echo "run      - Start ExoSeekr application (with logs)"
	@echo "build    - Build the Docker image"
	@echo "stop     - Stop all services"
	@echo "clean    - Stop and remove containers, networks, and volumes"
	@echo "logs     - Follow application logs"
	@echo "shell    - Open shell in running container"
	@echo "status   - Show PM2 process status"
	@echo "restart  - Restart all services"

# Start application
start:
	@echo "Starting ExoSeekr application..."
	docker-compose up --build -d

# Start with logs
run:
	@echo "Starting ExoSeekr application with logs..."
	docker-compose up --build

# Build only
build:
	@echo "Building ExoSeekr Docker image..."
	docker-compose build

# Stop services
stop:
	@echo "Stopping ExoSeekr services..."
	docker-compose down

# Clean everything
clean:
	@echo "Cleaning up ExoSeekr containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Follow logs
logs:
	@echo "Following ExoSeekr logs..."
	docker-compose logs -f

# Open shell
shell:
	@echo "Opening shell in ExoSeekr container..."
	docker exec -it $$(docker-compose ps -q exoseekr) bash

# Show PM2 status
status:
	@echo "ExoSeekr PM2 Process Status:"
	docker exec $$(docker-compose ps -q exoseekr) pm2 status

# Restart services
restart:
	@echo "Restarting ExoSeekr services..."
	docker-compose restart