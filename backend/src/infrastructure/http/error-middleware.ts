import type { FastifyInstance } from "fastify";

export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.status).send({
        error: { message: error.message, code: error.code },
      });
    }

    return reply.code(500).send({
      error: { message: "Internal Server Error", code: "INTERNAL" },
    });
  });
}
