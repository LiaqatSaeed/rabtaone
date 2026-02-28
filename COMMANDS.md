# Quick Reference - IdeaApp Commands

## Docker Commands (via start.sh)

```bash
# Starting & Stopping
./docker/start.sh start           # Start all services (foreground)
./docker/start.sh start-dev       # Start all services (background)
./docker/start.sh stop            # Stop all services
./docker/start.sh restart         # Restart all services
./docker/start.sh down            # Stop and remove containers
./docker/start.sh down-volumes    # Stop and remove containers + data (⚠️ destructive)

# Monitoring
./docker/start.sh status          # Show container status
./docker/start.sh logs            # View all logs
./docker/start.sh logs-backend    # View backend logs only
./docker/start.sh logs-frontend   # View frontend logs only
./docker/start.sh logs-db         # View database logs only

# Development
./docker/start.sh shell-backend   # Open shell in backend container
./docker/start.sh shell-db        # Open PostgreSQL shell
./docker/start.sh rebuild         # Rebuild and restart all services
./docker/start.sh clean           # Clean up everything (⚠️ destructive)

# Help
./docker/start.sh help            # Show all available commands
```

## Local Development Commands

```bash
# Setup (one-time)
pnpm install                      # Install all dependencies
pnpm prisma:generate              # Generate Prisma Client
pnpm prisma:migrate               # Run database migrations

# Development
pnpm dev:backend                  # Start backend dev server
pnpm dev:frontend                 # Start frontend dev server

# Building
pnpm build:backend                # Build backend for production
pnpm build:frontend               # Build frontend for production

# Database
cd backend
npx prisma studio                 # Open Prisma Studio (GUI)
npx prisma migrate dev            # Create and apply new migration
npx prisma migrate reset          # Reset database (⚠️ destructive)
npx prisma db seed                # Seed database (if configured)
```

## Docker Compose (Direct Commands)

```bash
# Starting & Stopping
docker compose -f docker/docker-compose.yml up                    # Start (foreground)
docker compose -f docker/docker-compose.yml up -d                 # Start (background)
docker compose -f docker/docker-compose.yml up --build            # Rebuild and start
docker compose -f docker/docker-compose.yml stop                  # Stop services
docker compose -f docker/docker-compose.yml down                  # Remove containers
docker compose -f docker/docker-compose.yml down -v               # Remove containers + volumes

# Monitoring
docker compose -f docker/docker-compose.yml ps                    # List containers
docker compose -f docker/docker-compose.yml logs                  # View all logs
docker compose -f docker/docker-compose.yml logs -f               # Follow logs (all)
docker compose -f docker/docker-compose.yml logs -f backend       # Follow backend logs
docker compose -f docker/docker-compose.yml logs -f frontend      # Follow frontend logs
docker compose -f docker/docker-compose.yml logs -f db            # Follow database logs

# Executing Commands
docker compose -f docker/docker-compose.yml exec backend sh       # Shell in backend
docker compose -f docker/docker-compose.yml exec backend pnpm prisma migrate deploy
docker compose -f docker/docker-compose.yml exec db psql -U ideaapp -d ideaapp
```

## Database Access

### Local PostgreSQL
```bash
# Connect to local database
psql -U ideaapp -d ideaapp -h localhost -p 5432

# Common psql commands
\l                                # List databases
\dt                               # List tables
\d table_name                     # Describe table
\q                                # Quit
```

### Docker PostgreSQL
```bash
# Connect to Docker database
docker compose -f docker/docker-compose.yml exec db psql -U ideaapp -d ideaapp

# Or from host machine (if port is exposed)
psql -U ideaapp -d ideaapp -h localhost -p 55432
```

## Git Commands (Common Workflows)

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Description of changes"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature/your-feature-name

# View logs
git log --oneline
```

## Environment Setup

```bash
# Docker
cp docker/.env.example docker/.env

# Backend (Local)
cp backend/.env.example backend/.env

# Frontend (Local)
cp frontend/.env.example frontend/.env
```

## Troubleshooting Commands

```bash
# Check if ports are in use
lsof -i :4000                     # Backend local
lsof -i :3000                     # Frontend local
lsof -i :7101                     # Backend Docker
lsof -i :7100                     # Frontend Docker
lsof -i :55432                    # PostgreSQL Docker

# Kill process on port
kill -9 $(lsof -t -i:PORT_NUMBER)

# Check Docker status
docker info                       # Docker daemon info
docker ps                         # Running containers
docker ps -a                      # All containers
docker images                     # List images
docker volume ls                  # List volumes

# Clean Docker system
docker system prune               # Remove unused data
docker system prune -a            # Remove all unused data (⚠️ destructive)
docker volume prune               # Remove unused volumes (⚠️ destructive)

# Check PostgreSQL status (local)
brew services list                # macOS - check services
sudo systemctl status postgresql  # Linux - check PostgreSQL status
pg_isready                        # Check if PostgreSQL is accepting connections
```

## Testing & Debugging

```bash
# Test backend health
curl http://localhost:4000/api/v1/healthz        # Local
curl http://localhost:7101/api/v1/healthz        # Docker

# Test database connection
psql -U ideaapp -d ideaapp -h localhost -p 5432 -c "SELECT version();"     # Local
psql -U ideaapp -d ideaapp -h localhost -p 55432 -c "SELECT version();"    # Docker

# View backend logs (local)
# Output is in terminal where you ran pnpm dev:backend

# View frontend logs (local)
# Output is in terminal where you ran pnpm dev:frontend
```

## Port Reference

### Docker Setup
- Frontend: `7100`
- Backend API: `7101`
- PostgreSQL: `55432` (external), `5432` (internal)

### Local Setup
- Frontend: `3000` (Next.js default)
- Backend API: `4000` (configured in backend/.env)
- PostgreSQL: `5432` (PostgreSQL default)

## Quick Start Cheatsheet

### First Time Setup (Docker)
```bash
cp docker/.env.example docker/.env
./docker/start.sh start
# Access: http://localhost:7100
```

### First Time Setup (Local)
```bash
# 1. Setup database
createdb ideaapp

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Install and setup
pnpm install
pnpm prisma:generate
pnpm prisma:migrate

# 4. Start (in separate terminals)
pnpm dev:backend
pnpm dev:frontend

# Access: http://localhost:3000
```

### Daily Development (Docker)
```bash
./docker/start.sh start-dev       # Start in background
./docker/start.sh logs-backend    # Check backend logs
./docker/start.sh stop            # Stop when done
```

### Daily Development (Local)
```bash
# Terminal 1
pnpm dev:backend

# Terminal 2
pnpm dev:frontend
```

---

**💡 Tip:** Add `./docker/start.sh` to your PATH or create an alias for easier access:
```bash
# Add to ~/.zshrc or ~/.bashrc
alias idea-start='./docker/start.sh start'
alias idea-stop='./docker/start.sh stop'
alias idea-logs='./docker/start.sh logs'
```
