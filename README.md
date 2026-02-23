# IdeaApp

Scalable multi-actor marketplace platform (users, merchants, delivery partners) built with Next.js 14, TypeScript, PostgreSQL, Prisma, Fastify, and Socket.io.

## Structure
- `backend/` Fastify API + Prisma
- `frontend/` Next.js web app
- `docker/` Dockerfiles and compose setup
- `database/` Database assets and init scripts

## Requirements
- Node.js 20.11.1 (see `.nvmrc`)
- pnpm 9.15.4+
- Docker (for container setup)

## Local (pnpm)
1. Install dependencies:
   - `pnpm install`
2. Backend env:
   - Copy `backend/.env.example` to `backend/.env`
3. Frontend env:
   - Copy `frontend/.env.example` to `frontend/.env`
4. Prisma client:
   - `pnpm prisma:generate`
5. Prisma migrations (dev):
   - `pnpm prisma:migrate`
6. Run services:
   - `pnpm dev:backend`
   - `pnpm dev:frontend`

## Docker Setup
1. Start the full stack:
   - `docker compose -f docker/docker-compose.yml up --build`
2. Services:
   - API: http://localhost:4000
   - Web: http://localhost:3000
   - DB:  localhost:5432

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

## Notes
- JWT auth protects all `/api/v1/*` except `auth/*` and `sync/webhook`.
- Socket.io server is mounted at `SOCKET_IO_PATH` (default `/socket.io`).
