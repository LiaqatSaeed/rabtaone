import type { FastifyInstance } from "fastify";
import { syncService } from "@/services/sync-service";
import { ok } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";
import { requireRole } from "@/infrastructure/http/require-role";
import { accessService } from "@/services/access-service";
import { profileRepo } from "@/infrastructure/db/repositories/profile-repo";
import { confirmSyncSchema } from "@/infrastructure/validation/zod-schemas/sync";

export async function registerSyncRoutes(app: FastifyInstance) {
  app.get("/sync/pending", async (req, reply) => {
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(role, ["MERCHANT"], { accountId, action: "LIST_SYNC_PENDING" });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const merchantId = await profileRepo.getMerchantProfileId(accountId);
    if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const pending = await syncService.listPendingByMerchant(merchantId);
    return ok(reply, pending);
  });

  app.post("/sync/:id/confirm", async (req, reply) => {
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(role, ["MERCHANT"], { accountId, action: "CONFIRM_SYNC" });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const merchantId = await profileRepo.getMerchantProfileId(accountId);
    if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");

    const syncRequestId = (req.params as { id: string }).id;
    const data = confirmSyncSchema.parse(req.body);

    const updated = await syncService.confirmSync({
      syncRequestId,
      merchantId,
      invoiceNumber: data.invoiceNumber,
      totalAmount: data.totalAmount,
    });
    return ok(reply, updated);
  });

  app.post("/sync/order", async (req, reply) => {
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(role, ["MERCHANT"], { accountId, action: "ERP_SYNC" });

    const payload = req.body as {
      orderId: string;
      status: string;
      data: Record<string, unknown>;
    };
    if (!payload.orderId) throw new AppError("Missing orderId", 400, "MISSING_ORDER_ID");
    await accessService.assertOrderAccess({ accountId, role, orderId: payload.orderId });

    await syncService.enqueueOrderSync(payload);
    const result = await syncService.sendOrder(payload);
    return ok(reply, result);
  });

  app.post("/sync/webhook", async (req, reply) => {
    const payload = req.body as Record<string, unknown>;
    const result = await syncService.handleWebhook(payload);
    return ok(reply, result);
  });
}
