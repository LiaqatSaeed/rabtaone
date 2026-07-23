import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  code: string;
  meta?: Record<string, unknown>;

  constructor(message: string, status = 400, code = "BAD_REQUEST", meta?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.meta = meta;
  }
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.status).send({
        error: { message: error.message, code: error.code, meta: error.meta },
      });
    }

    if (error instanceof ZodError) {
      const first = error.issues[0];
      const message = first ? `${first.path.join(".")}: ${first.message}` : "Invalid request";
      return reply.code(400).send({
        error: { message, code: "VALIDATION_ERROR", meta: { issues: error.issues } },
      });
    }

    req.log.error({ err: error }, "Unhandled error");
    return reply.code(500).send({
      error: { message: "Internal Server Error", code: "INTERNAL" },
    });
  });
}
