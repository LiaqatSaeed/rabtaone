import type { FastifyInstance } from "fastify";
import { ok } from "@/infrastructure/http/response";
import { env } from "@/config/env";
import { readFileSync } from "fs";
import { join } from "path";

function getVersion() {
  const candidates = [
    join(process.cwd(), "package.json"),
    join(process.cwd(), "..", "backend", "package.json"),
  ];
  for (const path of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(path, "utf-8"));
      if (pkg?.version) return pkg.version;
    } catch {
      continue;
    }
  }
  return "unknown";
}

export async function registerMetaRoutes(app: FastifyInstance) {
  app.get("/meta", async (_req, reply) => {
    return ok(reply, {
      version: getVersion(),
      buildTime: env.BUILD_TIME ?? null,
      gitCommit: env.GIT_COMMIT ?? null,
      docsVersion: env.DOCS_VERSION ?? "0.5.0",
    });
  });
}
