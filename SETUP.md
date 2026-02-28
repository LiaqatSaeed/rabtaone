# IdeaApp Setup Guide

This guide will help you set up and run IdeaApp either with Docker or locally without Docker.

## Table of Contents
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development Setup](#local-development-setup)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

---

## Quick Start with Docker

Docker is the easiest way to get started. Everything runs in containers!

### Step 1: Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Ensure Docker is running

### Step 2: Configure Environment
```bash
# Copy environment template
cp docker/.env.example docker/.env

# (Optional) Edit docker/.env to customize ports, credentials, etc.
```

### Step 3: Start the Application

**Option A: Using the management script (recommended)**
```bash
./docker/start.sh start
```

**Option B: Using docker compose directly**
```bash
docker compose -f docker/docker-compose.yml up --build
```

**What happens:**
1. PostgreSQL database starts on port `55432`
2. Backend runs migrations automatically
3. Backend API starts on port `7101`
4. Frontend starts on port `7100`

### Step 4: Access the Application
- Frontend: http://localhost:7100
- Backend API: http://localhost:7101
- Health Check: http://localhost:7101/api/v1/healthz

### Step 5: Manage the Application

**Using the management script:**
```bash
./docker/start.sh help          # Show all available commands
./docker/start.sh start-dev     # Start in background
./docker/start.sh logs          # View all logs
./docker/start.sh logs-backend  # View backend logs only
./docker/start.sh stop          # Stop services
./docker/start.sh restart       # Restart services
./docker/start.sh down          # Stop and remove containers
./docker/start.sh down-volumes  # Stop and remove all data (⚠️ deletes data)
```

**Using docker compose directly:**
```bash
# Stop containers
docker compose -f docker/docker-compose.yml down

# Stop and remove all data
docker compose -f docker/docker-compose.yml down -v
```

---

## Local Development Setup

For faster development cycles and easier debugging.

### Step 1: Prerequisites

**Install Required Software:**

- Node.js 20.11.1+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- pnpm 9.15.4+
- PostgreSQL 15+

**Install Node.js (using nvm):**
```bash
# Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 20.11.1
nvm use 20.11.1

# Install pnpm
npm install -g pnpm@9.15.4
```

**Install PostgreSQL:**

macOS (Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

Windows:
Download from [PostgreSQL official site](https://www.postgresql.org/download/windows/)

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Run these commands in psql:
CREATE USER ideaapp WITH PASSWORD 'ideaapp';
CREATE DATABASE ideaapp OWNER ideaapp;
GRANT ALL PRIVILEGES ON DATABASE ideaapp TO ideaapp;
\q
```

### Step 3: Configure Environment Variables

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

**Verify `backend/.env` contains:**
```env
DATABASE_URL=postgresql://ideaapp:ideaapp@localhost:5432/ideaapp
PORT=4000
JWT_SECRET=your_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
```

**Verify `frontend/.env` contains:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Step 4: Install Dependencies

```bash
# From project root
pnpm install
```

### Step 5: Setup Database Schema

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate
```

### Step 6: Start Development Servers

**Option A: Two Terminal Windows**

Terminal 1 (Backend):
```bash
pnpm dev:backend
```

Terminal 2 (Frontend):
```bash
pnpm dev:frontend
```

**Option B: Using tmux/screen (Optional)**
```bash
# Start backend in background
pnpm dev:backend &

# Start frontend
pnpm dev:frontend
```

### Step 7: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/api/v1/healthz

---

## Troubleshooting

### Docker Issues

**Problem: Port already in use**
```
Error: bind: address already in use
```

Solution:
```bash
# Check what's using the port
lsof -i :7101  # or :7100, :55432

# Either stop the conflicting service or change ports in docker/.env
```

**Problem: Database connection failed**
```
Error: Can't reach database server
```

Solution:
```bash
# Check database is running
docker compose -f docker/docker-compose.yml ps

# View database logs
docker compose -f docker/docker-compose.yml logs db

# Restart just the database
docker compose -f docker/docker-compose.yml restart db
```

**Problem: Migrations not running**

Solution:
```bash
# Run migrations manually
docker compose -f docker/docker-compose.yml exec backend pnpm prisma migrate deploy

# Check migration status
docker compose -f docker/docker-compose.yml exec backend pnpm prisma migrate status
```

### Local Development Issues

**Problem: PostgreSQL not running**
```
Error: connection to server failed
```

Solution:
```bash
# macOS
brew services start postgresql@15

# Ubuntu/Debian
sudo systemctl start postgresql

# Check status
psql postgres -c "SELECT version();"
```

**Problem: Database doesn't exist**
```
Error: database "ideaapp" does not exist
```

Solution:
```bash
# Create the database
psql postgres -c "CREATE DATABASE ideaapp;"

# Verify
psql -l | grep ideaapp
```

**Problem: Prisma Client not generated**
```
Error: @prisma/client did not initialize yet
```

Solution:
```bash
pnpm prisma:generate
```

**Problem: Wrong Node.js version**
```
Error: The engine does not support...
```

Solution:
```bash
# Check Node version
node --version

# Install correct version
nvm install 20.11.1
nvm use 20.11.1

# Regenerate Prisma Client
pnpm prisma:generate
```

### Common Issues (Both Setups)

**Problem: Frontend can't connect to backend**

Check:
1. Backend is running
2. `NEXT_PUBLIC_API_BASE_URL` is correct in frontend `.env`
3. CORS is properly configured
4. Ports match between frontend config and backend

**Problem: 401 Unauthorized errors**

This is expected! Most API endpoints require authentication.
- Register a user first
- Login to get a JWT token
- Include token in `Authorization: Bearer <token>` header

---

## Architecture Overview

### Project Structure
```
rabtaone/
├── backend/           # Fastify API server
│   ├── src/          # Source code
│   ├── prisma/       # Database schema & migrations
│   └── package.json
├── frontend/          # Next.js application
│   ├── src/          # Source code
│   └── package.json
├── docker/           # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   └── .env.example
└── database/         # Database scripts
```

### Port Reference

**Docker Setup:**
- Frontend: `7100`
- Backend: `7101`
- PostgreSQL: `55432` (external), `5432` (internal)

**Local Setup:**
- Frontend: `3000` (Next.js default)
- Backend: `4000` (configurable in backend/.env)
- PostgreSQL: `5432` (PostgreSQL default)

### Technology Stack
- **Backend**: Fastify, Prisma ORM, Socket.io
- **Frontend**: Next.js 14, React 18, TypeScript
- **Database**: PostgreSQL 15
- **Auth**: JWT with refresh tokens
- **Real-time**: Socket.io

### Environment Variables Flow

**Docker:**
```
docker/.env → docker-compose.yml → Container ENV → Application
```

**Local:**
```
backend/.env → Node.js process → Application
frontend/.env → Next.js build → Browser
```

---

## Next Steps

After setup, check out:
- [API Documentation](backend/docs/)
- [ERP Integration Guide](backend/docs/erp-integration.md) (if exists)
- Seeding data: `node backend/scripts/seed-order.js`
- Running tests: `pnpm test` (if tests exist)

---

## Need Help?

1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs:
   - Docker: `docker compose -f docker/docker-compose.yml logs`
   - Local: Check terminal output
3. Verify environment variables match the required format
4. Ensure all prerequisites are installed and running

Happy coding! 🚀
