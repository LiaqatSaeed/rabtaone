import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerApiRoutes } from "@/routes";
import { registerErrorHandler, AppError } from "@/infrastructure/http/error-middleware";
import { verifyToken } from "@/lib/jwt";
import { createSocketServer } from "@/infrastructure/realtime/socket-server";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
registerErrorHandler(app);

const publicPaths = new Set(["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/sync/webhook"]);

app.addHook("preHandler", async (req) => {
  if (publicPaths.has(req.url)) return;
  if (!req.url.startsWith("/api/v1")) return;

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

  const payload = verifyToken(token);
  req.user = { sub: payload.sub, role: payload.role };
});

await app.register(registerApiRoutes, { prefix: "/api/v1" });

app.get("/api/v1/healthz", async (_req, reply) => {
  return reply.code(200).send({ ok: true });
});

createSocketServer(app.server);

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: "0.0.0.0" });

console.log(`API listening on :${port}`);
