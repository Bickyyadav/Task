.PHONY: dev test build logs down clean

# Run the full stack in development mode
dev:
	docker compose up --build

# Run tests inside the API container
test:
	docker compose exec api pytest -v tests/

# Build images without starting
build:
	docker compose build

# Tail logs from all services
logs:
	docker compose logs -f

# Stop all services
down:
	docker compose down

# Stop and remove volumes (DESTRUCTIVE)
clean:
	docker compose down -v
