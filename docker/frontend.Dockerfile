FROM node:20-alpine
WORKDIR /app
RUN corepack enable

COPY frontend/package.json ./frontend/package.json
COPY pnpm-workspace.yaml package.json ./
COPY docker/frontend.dockerignore ./frontend/.dockerignore
RUN pnpm install --filter ideaapp-frontend

COPY frontend/tsconfig.json frontend/next.config.mjs frontend/next-env.d.ts ./frontend/
COPY frontend/src ./frontend/src

WORKDIR /app/frontend
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
