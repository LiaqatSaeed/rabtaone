# IdeaApp

Scalable multi-actor marketplace platform (users, merchants, delivery partners) built with Next.js 14, TypeScript, PostgreSQL, Prisma, Fastify, and Socket.io.

## Structure
- `backend/` Fastify API + Prisma
- `frontend/` Next.js web app
- `docker/` Dockerfiles and compose setup
- `database/` Database assets and init scripts

## Requirements

### For Local Development (without Docker)
- Node.js 20.11.1+ (see `.nvmrc`)
- pnpm 9.15.4+
- PostgreSQL 15+ (running locally)

### For Docker Development
- Docker & Docker Compose
- Node.js 20.11.1+ (optional, for local tooling)

---

## 🚀 Quick Start - Docker (Recommended)

Docker setup includes PostgreSQL, backend, and frontend - everything in one command!

> **💡 Tip:** Run `./docker/check-setup.sh` anytime to verify your environment and diagnose issues.

### 1. Configure Environment Variables

```bash
# Copy the example environment file
cp docker/.env.example docker/.env
```

Edit `docker/.env` and update any values as needed (optional - defaults work out of the box).

### 2. Start the Stack

**Option A: Using the management script (recommended)**
```bash
./docker/start.sh start
```

**Option B: Using docker compose directly**
```bash
docker compose -f docker/docker-compose.yml up --build
```

This will:
- Start PostgreSQL on port `55432`
- Run database migrations automatically
- Start the backend API on port `7101`
- Start the frontend on port `7100`

### 3. Access the Application

- **Frontend**: http://localhost:7100
- **Backend API**: http://localhost:7101
- **Database**: localhost:55432

### 4. Manage the Stack

The `docker/start.sh` script provides convenient commands:

```bash
./docker/start.sh start         # Start all services
./docker/start.sh start-dev     # Start in background
./docker/start.sh stop          # Stop services
./docker/start.sh restart       # Restart services
./docker/start.sh logs          # View all logs
./docker/start.sh logs-backend  # View backend logs only
./docker/start.sh status        # Show container status
./docker/start.sh down          # Stop and remove containers
./docker/start.sh help          # Show all commands
```

Or stop manually:
```bash
docker compose -f docker/docker-compose.yml down

# Remove volumes (database data):
docker compose -f docker/docker-compose.yml down -v
```

---

## 🛠️ Local Development (without Docker)

For faster development iteration and debugging.

### 1. Prerequisites

Ensure PostgreSQL is installed and running locally:

```bash
# macOS (via Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create user and database
CREATE USER ideaapp WITH PASSWORD 'ideaapp';
CREATE DATABASE ideaapp OWNER ideaapp;
\q
```

### 3. Configure Environment Variables

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

**Backend `.env`** should have:
```env
DATABASE_URL=postgresql://ideaapp:ideaapp@localhost:5432/ideaapp
PORT=4000
JWT_SECRET=change_me_to_a_long_random_string
```

**Frontend `.env.example`** should have:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Setup Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate
```

### 6. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
pnpm dev:backend
```

**Terminal 2 - Frontend:**
```bash
pnpm dev:frontend
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

---

## 📝 Environment Variables Reference

### Docker Environment (`docker/.env`)
```env
# Database
POSTGRES_USER=ideaapp
POSTGRES_PASSWORD=ideaapp
POSTGRES_DB=ideaapp
DB_PORT=55432              # External port for PostgreSQL

# Ports
BACKEND_PORT=7101          # Backend API port
FRONTEND_PORT=7100         # Frontend port

# Application
JWT_SECRET=change_me_to_a_long_random_string
ERP_BASE_URL=https://erp.example.com
ERP_API_KEY=replace_me
```

### Backend Environment (`backend/.env`)
```env
DATABASE_URL=postgresql://ideaapp:ideaapp@localhost:5432/ideaapp
PORT=4000
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
SOCKET_IO_PATH=/socket.io
ERP_BASE_URL=https://erp.example.com
ERP_API_KEY=replace_me
```

### Frontend Environment (`frontend/.env`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## 🔧 Useful Commands

### Local Development

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma:generate

# Run migrations (dev)
pnpm prisma:migrate

# Start backend dev server
pnpm dev:backend

# Start frontend dev server
pnpm dev:frontend

# Build backend
pnpm build:backend

# Build frontend
pnpm build:frontend
```

### Docker

```bash
# Start all services
docker compose -f docker/docker-compose.yml up

# Start in background
docker compose -f docker/docker-compose.yml up -d

# Rebuild and start
docker compose -f docker/docker-compose.yml up --build

# Stop services
docker compose -f docker/docker-compose.yml down

# View logs
docker compose -f docker/docker-compose.yml logs -f

# View backend logs only
docker compose -f docker/docker-compose.yml logs -f backend

# Execute commands in running container
docker compose -f docker/docker-compose.yml exec backend sh

# Reset everything (including volumes)
docker compose -f docker/docker-compose.yml down -v
```

---

## 🗄️ Database Management

### Local

```bash
# Open Prisma Studio
cd backend
npx prisma studio

# Create new migration
pnpm prisma:migrate

# Reset database (caution: deletes all data!)
npx prisma migrate reset
```

### Docker

```bash
# Connect to PostgreSQL in Docker
docker compose -f docker/docker-compose.yml exec db psql -U ideaapp -d ideaapp

# Run migrations manually
docker compose -f docker/docker-compose.yml exec backend pnpm prisma migrate deploy

# Open Prisma Studio (ensure backend is running)
docker compose -f docker/docker-compose.yml exec backend npx prisma studio
```

## ERP Polling (Demo)
1. Seed a merchant and get a JWT:
   - `JWT_SECRET=your_secret node backend/scripts/seed-merchant.js`
2. Start polling:
   - `ERP_BASE_URL=http://localhost:4000 ERP_JWT_TOKEN=your_jwt node backend/scripts/erp-polling.js`

## Seed Sample Order
- `node backend/scripts/seed-order.js`

## End-to-End Script
- `JWT_SECRET=your_secret ./scripts/e2e.sh`

Optional env:
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`
- `SEED_MERCHANT_EMAIL`
- `SEED_MERCHANT_PASSWORD`
- `SEED_MERCHANT_INDUSTRY`

## API Docs (Basic)
- Create order example: `backend/docs/order-create.md`

## Merchant Dashboard (Frontend)
- Login: http://localhost:7100/login
- Dashboard: http://localhost:7100/merchant

## Notes
- JWT auth protects all `/api/v1/*` except `auth/*` and `sync/webhook`.
- Socket.io server is mounted at `SOCKET_IO_PATH` (default `/socket.io`).
