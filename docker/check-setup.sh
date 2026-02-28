#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}IdeaApp Environment Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ISSUES=0

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    ((ISSUES++))
  fi
}

# Check Docker
echo -e "${BLUE}🐳 Docker Setup${NC}"
if command_exists docker; then
  print_status 0 "Docker CLI installed"
  if docker info > /dev/null 2>&1; then
    print_status 0 "Docker daemon running"
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "   Version: ${DOCKER_VERSION}"
  else
    print_status 1 "Docker daemon not running"
  fi
else
  print_status 1 "Docker not installed"
fi

if command_exists docker compose; then
  print_status 0 "Docker Compose available"
else
  print_status 1 "Docker Compose not installed"
fi
echo ""

# Check Node.js
echo -e "${BLUE}📦 Node.js Setup${NC}"
if command_exists node; then
  NODE_VERSION=$(node --version)
  print_status 0 "Node.js installed"
  echo -e "   Version: ${NODE_VERSION}"

  REQUIRED_VERSION="v20.11.1"
  if [[ "$NODE_VERSION" == "$REQUIRED_VERSION"* ]] || [[ "$NODE_VERSION" > "$REQUIRED_VERSION" ]]; then
    print_status 0 "Node.js version compatible (>= v20.11.1)"
  else
    print_status 1 "Node.js version too old (need >= v20.11.1, have $NODE_VERSION)"
  fi
else
  print_status 1 "Node.js not installed"
fi
echo ""

# Check pnpm
echo -e "${BLUE}📦 pnpm Setup${NC}"
if command_exists pnpm; then
  PNPM_VERSION=$(pnpm --version)
  print_status 0 "pnpm installed"
  echo -e "   Version: ${PNPM_VERSION}"
else
  print_status 1 "pnpm not installed (run: npm install -g pnpm)"
fi
echo ""

# Check PostgreSQL (local)
echo -e "${BLUE}🐘 PostgreSQL Setup (Local)${NC}"
if command_exists psql; then
  print_status 0 "PostgreSQL client installed"

  if command_exists pg_isready; then
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
      print_status 0 "PostgreSQL server running on port 5432"
    else
      echo -e "${YELLOW}⚠️  PostgreSQL not running on port 5432 (needed for local dev)${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠️  PostgreSQL client not installed (only needed for local dev)${NC}"
fi
echo ""

# Check Environment Files
echo -e "${BLUE}📝 Environment Files${NC}"
if [ -f "$ROOT_DIR/docker/.env" ]; then
  print_status 0 "docker/.env exists"
else
  print_status 1 "docker/.env missing (run: cp docker/.env.example docker/.env)"
fi

if [ -f "$ROOT_DIR/backend/.env" ]; then
  print_status 0 "backend/.env exists"
else
  echo -e "${YELLOW}⚠️  backend/.env missing (only needed for local dev)${NC}"
fi

if [ -f "$ROOT_DIR/frontend/.env" ]; then
  print_status 0 "frontend/.env exists"
else
  echo -e "${YELLOW}⚠️  frontend/.env missing (only needed for local dev)${NC}"
fi
echo ""

# Check Docker Services (if running)
if docker info > /dev/null 2>&1; then
  echo -e "${BLUE}🔍 Docker Services Status${NC}"

  if docker ps --format '{{.Names}}' | grep -q "ideaapp-db"; then
    print_status 0 "Database container running"
  else
    echo -e "${YELLOW}⚠️  Database container not running${NC}"
  fi

  if docker ps --format '{{.Names}}' | grep -q "ideaapp-backend"; then
    print_status 0 "Backend container running"
  else
    echo -e "${YELLOW}⚠️  Backend container not running${NC}"
  fi

  if docker ps --format '{{.Names}}' | grep -q "ideaapp-frontend"; then
    print_status 0 "Frontend container running"
  else
    echo -e "${YELLOW}⚠️  Frontend container not running${NC}"
  fi
  echo ""
fi

# Check Ports
echo -e "${BLUE}🔌 Port Availability${NC}"
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $1 is in use${NC}"
    if [ -n "$2" ]; then
      echo -e "   Used by: $2"
    fi
  else
    echo -e "${GREEN}✅ Port $1 is available${NC}"
  fi
}

check_port 7100 "Frontend (Docker)"
check_port 7101 "Backend (Docker)"
check_port 55432 "PostgreSQL (Docker)"
check_port 3000 "Frontend (Local)"
check_port 4000 "Backend (Local)"
check_port 5432 "PostgreSQL (Local)"
echo ""

# Check Project Structure
echo -e "${BLUE}📁 Project Structure${NC}"
[ -d "$ROOT_DIR/backend" ] && print_status 0 "backend/ directory exists" || print_status 1 "backend/ directory missing"
[ -d "$ROOT_DIR/frontend" ] && print_status 0 "frontend/ directory exists" || print_status 1 "frontend/ directory missing"
[ -d "$ROOT_DIR/docker" ] && print_status 0 "docker/ directory exists" || print_status 1 "docker/ directory missing"
[ -f "$ROOT_DIR/pnpm-workspace.yaml" ] && print_status 0 "pnpm-workspace.yaml exists" || print_status 1 "pnpm-workspace.yaml missing"
echo ""

# Check Dependencies
if [ -d "$ROOT_DIR/node_modules" ]; then
  echo -e "${BLUE}📚 Dependencies${NC}"
  print_status 0 "node_modules exists"

  if [ -d "$ROOT_DIR/backend/node_modules" ]; then
    print_status 0 "Backend dependencies installed"
  else
    echo -e "${YELLOW}⚠️  Backend dependencies not installed (run: pnpm install)${NC}"
  fi

  if [ -d "$ROOT_DIR/frontend/node_modules" ]; then
    print_status 0 "Frontend dependencies installed"
  else
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed (run: pnpm install)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Dependencies not installed (run: pnpm install)${NC}"
fi
echo ""

# Test Endpoints (if services are running)
echo -e "${BLUE}🌐 Service Health Checks${NC}"
if curl -s http://localhost:7101/api/v1/healthz > /dev/null 2>&1; then
  print_status 0 "Backend API responding (Docker)"
else
  echo -e "${YELLOW}⚠️  Backend API not responding at http://localhost:7101${NC}"
fi

if curl -s http://localhost:4000/api/v1/healthz > /dev/null 2>&1; then
  print_status 0 "Backend API responding (Local)"
else
  echo -e "${YELLOW}⚠️  Backend API not responding at http://localhost:4000${NC}"
fi

if curl -s http://localhost:7100 > /dev/null 2>&1; then
  print_status 0 "Frontend responding (Docker)"
else
  echo -e "${YELLOW}⚠️  Frontend not responding at http://localhost:7100${NC}"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
  print_status 0 "Frontend responding (Local)"
else
  echo -e "${YELLOW}⚠️  Frontend not responding at http://localhost:3000${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Your environment is ready.${NC}"
else
  echo -e "${YELLOW}⚠️  Found $ISSUES issue(s). Please review the output above.${NC}"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Recommendations
if [ $ISSUES -gt 0 ]; then
  echo -e "${BLUE}📋 Recommendations:${NC}"
  echo ""
  echo "For Docker setup:"
  echo "  1. Ensure Docker Desktop is installed and running"
  echo "  2. Copy environment file: cp docker/.env.example docker/.env"
  echo "  3. Start services: ./docker/start.sh start"
  echo ""
  echo "For Local setup:"
  echo "  1. Install Node.js 20.11.1+ and pnpm"
  echo "  2. Install and start PostgreSQL"
  echo "  3. Copy env files: cp backend/.env.example backend/.env"
  echo "  4. Install dependencies: pnpm install"
  echo "  5. Run migrations: pnpm prisma:migrate"
  echo "  6. Start services: pnpm dev:backend (and pnpm dev:frontend)"
  echo ""
fi

exit $ISSUES
