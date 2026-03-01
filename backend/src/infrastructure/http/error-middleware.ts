import type { FastifyInstance } from "fastify";

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
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.status).send({
        error: { message: error.message, code: error.code, meta: error.meta },
      });
    }

    return reply.code(500).send({
      error: { message: "Internal Server Error", code: "INTERNAL" },
    });
  });
}
