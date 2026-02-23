FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

COPY backend/package.json ./backend/package.json
COPY pnpm-workspace.yaml package.json ./
COPY docker/backend.dockerignore ./backend/.dockerignore
RUN pnpm install --filter ideaapp-backend

COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/prisma ./backend/prisma
COPY backend/src ./backend/src

WORKDIR /app/backend
RUN pnpm prisma:generate
RUN pnpm build

EXPOSE 4000
CMD ["pnpm", "start"]
