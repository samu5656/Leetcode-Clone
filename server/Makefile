include .envrc

# ==================================================================================== #
# HELPERS
# ==================================================================================== #

## help: print this help message
.PHONY: help
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

# ==================================================================================== #
# DEVELOPMENT
# ==================================================================================== #

## run/api: run the cmd/api application
.PHONY: run/api
run/api:
	go run ./cmd/api -db-dsn=${DSA_DB_DSN} -jwt-access-secret=${DSA_JWT_ACCESS_SECRET} -jwt-refresh-secret=${DSA_JWT_REFRESH_SECRET} -piston-url=${DSA_PISTON_URL} -port=${DSA_PORT} -env=${DSA_ENV}

## docker/up: start docker containers
.PHONY: docker/up
docker/up:
	docker compose up -d

## docker/down: stop docker containers
.PHONY: docker/down
docker/down:
	docker compose down

## piston/install: install supported language runtimes (gcc=c++, java, node=javascript, python)
.PHONY: piston/install
piston/install:
	@echo "Installing supported language runtimes in Piston..."
	@for lang in gcc java node python; do \
		echo "  → Installing $$lang..."; \
		curl -s -X POST http://localhost:2000/api/v2/packages \
			-H "Content-Type: application/json" \
			-d "{\"language\": \"$$lang\", \"version\": \"*\"}" \
			| head -c 100; echo; \
	done
	@echo "Done! Checking installed runtimes:"
	@curl -s http://localhost:2000/api/v2/runtimes | python3 -m json.tool 2>/dev/null || curl -s http://localhost:2000/api/v2/runtimes

## piston/runtimes: list installed runtimes
.PHONY: piston/runtimes
piston/runtimes:
	@curl -s http://localhost:2000/api/v2/runtimes | python3 -m json.tool 2>/dev/null || curl -s http://localhost:2000/api/v2/runtimes

# ==================================================================================== #
# DATABASE
# ==================================================================================== #

## db/migrations/up: apply all up database migrations using psql
.PHONY: db/migrations/up
db/migrations/up:
	@echo 'Running up migrations...'
	@for f in $$(ls -v ./migrations/*.up.sql); do \
		echo "  → Applying $$f"; \
		docker exec -i server-db-1 psql -U postgres -d dsa_contest < $$f; \
	done
	@echo 'Migrations applied.'

## db/migrations/down: apply all down database migrations using psql
.PHONY: db/migrations/down
db/migrations/down:
	@echo 'Running down migrations...'
	@for f in $$(ls -vr ./migrations/*.down.sql); do \
		echo "  → Applying $$f"; \
		docker exec -i server-db-1 psql -U postgres -d dsa_contest < $$f; \
	done
	@echo 'Down migrations applied.'

## db/seed: seed the database with initial data
.PHONY: db/seed
db/seed:
	@echo 'Seeding database...'
	docker exec -i server-db-1 psql -U postgres -d dsa_contest < ./scripts/seed.sql
	@echo 'Database seeded.'

## db/reset: drop all tables, re-run migrations and seed
.PHONY: db/reset
db/reset: db/migrations/down db/migrations/up db/seed

# ==================================================================================== #
# QUALITY CONTROL
# ==================================================================================== #

## audit: tidy dependencies and vet code
.PHONY: audit
audit:
	@echo 'Tidying and verifying module dependencies...'
	go mod tidy
	go mod verify
	@echo 'Vetting code...'
	go vet ./...
	@echo 'Running tests...'
	go test -race -vet=off ./...

## test: run all tests
.PHONY: test
test:
	go test -v -race ./...
