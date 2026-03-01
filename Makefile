SHELL := /bin/sh
COMPOSE := docker compose -f docker/docker-compose.yml
API_BASE_URL ?= http://localhost:7101

.PHONY: up down smoke smoke-up logs reset

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f backend

smoke:
	E2E_MODE=true API_BASE_URL=$(API_BASE_URL) pnpm --filter ideaapp-backend e2e:smoke

reset:
	E2E_MODE=true pnpm --filter ideaapp-backend e2e:reset

smoke-up:
	E2E_MODE=true $(COMPOSE) up -d --build
	E2E_MODE=true API_BASE_URL=$(API_BASE_URL) pnpm --filter ideaapp-backend e2e:smoke
