import type { FastifyInstance } from "fastify";
import { notificationService } from "@/services/notification-service";
import { ok } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get("/notifications", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const notifications = await notificationService.listForAccount(accountId);
    return ok(reply, notifications);
  });
}
