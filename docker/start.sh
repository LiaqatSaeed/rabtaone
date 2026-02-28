#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/docker/.env"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables if .env exists
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs) || true
else
  echo -e "${YELLOW}⚠️  Warning: docker/.env not found. Using defaults.${NC}"
  echo -e "${BLUE}ℹ️  Run: cp docker/.env.example docker/.env${NC}"
fi

# Function to display usage
usage() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}IdeaApp Docker Management Script${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  start         Start all services (with build)"
  echo "  start-dev     Start all services in detached mode"
  echo "  stop          Stop all services"
  echo "  restart       Restart all services"
  echo "  down          Stop and remove containers"
  echo "  down-volumes  Stop and remove containers and volumes (⚠️  deletes data)"
  echo "  logs          View logs from all services"
  echo "  logs-backend  View backend logs only"
  echo "  logs-frontend View frontend logs only"
  echo "  logs-db       View database logs only"
  echo "  status        Show running containers"
  echo "  shell-backend Open shell in backend container"
  echo "  shell-db      Open PostgreSQL shell"
  echo "  rebuild       Rebuild and restart all services"
  echo "  clean         Clean up everything (containers, volumes, images)"
  echo ""
  echo "Examples:"
  echo "  $0 start           # Start the application"
  echo "  $0 logs-backend    # View backend logs"
  echo "  $0 stop            # Stop the application"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
    exit 1
  fi
}

# Function to cleanup dangling images and volumes
cleanup_dangling() {
  echo -e "${YELLOW}🧹 Cleaning up dangling Docker resources...${NC}"

  # Remove dangling images (untagged images)
  DANGLING_IMAGES=$(docker images -f "dangling=true" -q 2>/dev/null)
  if [ -n "$DANGLING_IMAGES" ]; then
    echo -e "${BLUE}  Removing dangling images...${NC}"
    docker rmi $DANGLING_IMAGES 2>/dev/null || true
    echo -e "${GREEN}  ✓ Dangling images removed${NC}"
  else
    echo -e "${GREEN}  ✓ No dangling images to remove${NC}"
  fi

  # Remove dangling volumes (unused volumes)
  DANGLING_VOLUMES=$(docker volume ls -f "dangling=true" -q 2>/dev/null)
  if [ -n "$DANGLING_VOLUMES" ]; then
    echo -e "${BLUE}  Removing dangling volumes...${NC}"
    docker volume rm $DANGLING_VOLUMES 2>/dev/null || true
    echo -e "${GREEN}  ✓ Dangling volumes removed${NC}"
  else
    echo -e "${GREEN}  ✓ No dangling volumes to remove${NC}"
  fi

  echo -e "${GREEN}✅ Cleanup complete${NC}"
  echo ""
}

# Main commands
case "${1:-}" in
  start)
    check_docker
    cleanup_dangling
    echo -e "${GREEN}🚀 Starting IdeaApp with Docker...${NC}"
    docker compose -f "$COMPOSE_FILE" up --build
    ;;

  start-dev)
    check_docker
    cleanup_dangling
    echo -e "${GREEN}🚀 Starting IdeaApp in background...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Frontend:  http://localhost:${FRONTEND_PORT:-7100}"
    echo -e "  Backend:   http://localhost:${BACKEND_PORT:-7101}"
    echo -e "  Database:  localhost:${DB_PORT:-55432}"
    echo ""
    echo -e "${YELLOW}View logs: $0 logs${NC}"
    ;;

  stop)
    echo -e "${YELLOW}⏸️  Stopping all services...${NC}"
    docker compose -f "$COMPOSE_FILE" stop
    echo -e "${GREEN}✅ Services stopped${NC}"
    ;;

  restart)
    echo -e "${YELLOW}🔄 Restarting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" restart
    echo -e "${GREEN}✅ Services restarted${NC}"
    ;;

  down)
    echo -e "${YELLOW}⏬ Stopping and removing containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}✅ Containers removed${NC}"
    ;;

  down-volumes)
    echo -e "${RED}⚠️  WARNING: This will delete all database data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo -e "${YELLOW}⏬ Stopping and removing containers and volumes...${NC}"
      docker compose -f "$COMPOSE_FILE" down -v
      echo -e "${GREEN}✅ Containers and volumes removed${NC}"
    else
      echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
    fi
    ;;

  logs)
    echo -e "${BLUE}📋 Showing logs (Ctrl+C to exit)...${NC}"
    docker compose -f "$COMPOSE_FILE" logs -f
    ;;

  logs-backend)
    echo -e "${BLUE}📋 Showing backend logs (Ctrl+C to exit)...${NC}"
    docker compose -f "$COMPOSE_FILE" logs -f backend
    ;;

  logs-frontend)
    echo -e "${BLUE}📋 Showing frontend logs (Ctrl+C to exit)...${NC}"
    docker compose -f "$COMPOSE_FILE" logs -f frontend
    ;;

  logs-db)
    echo -e "${BLUE}📋 Showing database logs (Ctrl+C to exit)...${NC}"
    docker compose -f "$COMPOSE_FILE" logs -f db
    ;;

  status)
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker compose -f "$COMPOSE_FILE" ps
    ;;

  shell-backend)
    echo -e "${BLUE}🐚 Opening shell in backend container...${NC}"
    docker compose -f "$COMPOSE_FILE" exec backend sh
    ;;

  shell-db)
    echo -e "${BLUE}🐚 Opening PostgreSQL shell...${NC}"
    docker compose -f "$COMPOSE_FILE" exec db psql -U ${POSTGRES_USER:-ideaapp} -d ${POSTGRES_DB:-ideaapp}
    ;;

  rebuild)
    check_docker
    echo -e "${YELLOW}🔨 Rebuilding all services...${NC}"
    docker compose -f "$COMPOSE_FILE" down
    cleanup_dangling
    docker compose -f "$COMPOSE_FILE" up --build -d
    echo -e "${GREEN}✅ Rebuild complete${NC}"
    ;;

  clean)
    echo -e "${RED}⚠️  WARNING: This will remove all containers, volumes, and images!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo -e "${YELLOW}🧹 Cleaning up...${NC}"
      docker compose -f "$COMPOSE_FILE" down -v --rmi all
      echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
      echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
    fi
    ;;

  help|--help|-h)
    usage
    ;;

  *)
    if [ -z "${1:-}" ]; then
      # No argument provided, show usage and default to start
      usage
      echo ""
      echo -e "${YELLOW}No command specified. Starting services...${NC}"
      echo ""
      check_docker
      cleanup_dangling
      docker compose -f "$COMPOSE_FILE" up --build
    else
      echo -e "${RED}❌ Unknown command: $1${NC}"
      echo ""
      usage
      exit 1
    fi
    ;;
esac
