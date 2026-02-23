import type { FastifyInstance } from "fastify";
import { registerSchema, loginSchema } from "@/infrastructure/validation/zod-schemas/auth";
import { authService } from "@/services/auth-service";
import { created, ok } from "@/infrastructure/http/response";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const data = registerSchema.parse(req.body);
    const account = await authService.register({
      email: data.email,
      password: data.password,
      role: data.role,
      fullName: data.fullName,
      businessName: data.businessName,
      industryType: data.industryType,
    });
    return created(reply, account);
  });

  app.post("/auth/login", async (req, reply) => {
    const data = loginSchema.parse(req.body);
    const session = await authService.login(data);
    return ok(reply, session);
  });
}
