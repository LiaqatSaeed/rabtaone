import type { FastifyInstance } from "fastify";
import { createOrderSchema, updateOrderStatusSchema } from "@/infrastructure/validation/zod-schemas/orders";
import { orderService } from "@/services/order-service";
import { created, ok } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";
import { profileRepo } from "@/infrastructure/db/repositories/profile-repo";
import { requireRole } from "@/infrastructure/http/require-role";
import { accessService } from "@/services/access-service";
import { proposalService } from "@/services/proposal-service";
import { proposalRepo } from "@/infrastructure/db/repositories/proposal-repo";
import { logger } from "@/lib/logger";

export async function registerOrderRoutes(app: FastifyInstance) {
  app.post("/orders", async (req, reply) => {
    const data = createOrderSchema.parse(req.body);
    if (data.declaredTotalAmount !== undefined && data.items?.length) {
      const computed = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const diff = Math.abs(computed - data.declaredTotalAmount);
      if (diff > 0.01) {
        throw new AppError("Declared total amount mismatch", 400, "TOTAL_MISMATCH");
      }
    }
    const accountId = req.user?.sub ?? "";
    const role = req.user?.role ?? null;
    requireRole(role, ["USER"], { accountId, action: "CREATE_ORDER" });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const userId = await profileRepo.getUserProfileId(accountId);
    if (!userId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const order = await orderService.createOrder({
      userId,
      prescriptionUrl: data.prescriptionUrl,
      notes: data.notes,
      shipName: data.shipping?.name,
      shipPhone: data.shipping?.phone,
      shipAddress1: data.shipping?.address1,
      shipAddress2: data.shipping?.address2,
      shipCity: data.shipping?.city,
      shipState: data.shipping?.state,
      shipPostalCode: data.shipping?.postalCode,
      shipCountry: data.shipping?.country,
      items: data.items,
    });
    return created(reply, order);
  });

  app.get("/orders", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const role = req.user?.role ?? null;
    requireRole(role, ["USER"], { accountId, action: "LIST_ORDERS" });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const userId = await profileRepo.getUserProfileId(accountId);
    if (!userId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const orders = await orderService.listForUser(userId);
    return ok(reply, orders);
  });

  app.get("/orders/:id", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const role = req.user?.role ?? null;
    const orderId = (req.params as { id: string }).id;
    const order = await accessService.assertOrderAccess({ accountId, role, orderId });
    return ok(reply, order);
  });

  app.patch("/orders/:id/status", async (req, reply) => {
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(role, ["USER", "MERCHANT", "DELIVERY"], {
      accountId,
      action: "UPDATE_ORDER_STATUS",
      resourceId: orderId,
    });
    await accessService.assertOrderAccess({ accountId, role, orderId });

    const data = updateOrderStatusSchema.parse(req.body);
    const roleAllowed: Record<string, string[]> = {
      USER: ["CANCELLED"],
      MERCHANT: ["ACCEPTED", "SYNC_PENDING", "SYNCED", "OUT_FOR_DELIVERY", "CANCELLED"],
      DELIVERY: ["OUT_FOR_DELIVERY", "COMPLETED"],
    };
    if (!role || !(roleAllowed[role] ?? []).includes(data.status)) {
      logger.warn("Forbidden order status transition", {
        accountId,
        role,
        orderId,
        targetStatus: data.status,
      });
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    let merchantId: string | undefined;
    if (role === "MERCHANT" && data.status === "ACCEPTED") {
      merchantId = await profileRepo.getMerchantProfileId(accountId);
      if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const order = await orderService.transitionStatus(orderId, data.status, merchantId);
    return ok(reply, order);
  });

  app.get("/orders/:id/proposals", async (req, reply) => {
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(role, ["USER", "MERCHANT"], {
      accountId,
      action: "LIST_PROPOSALS",
      resourceId: orderId,
    });

    if (role === "USER") {
      await accessService.assertOrderAccess({ accountId, role, orderId });
      const proposals = await proposalService.listForOrder(orderId);
      return ok(reply, proposals);
    }

    const merchantId = await profileRepo.getMerchantProfileId(accountId);
    if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const hasProposal = await proposalRepo.hasForOrderAndMerchant(orderId, merchantId);
    if (!hasProposal) {
      logger.warn("Forbidden proposal access", { accountId, merchantId, orderId });
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    const proposals = await proposalRepo.listByOrderAndMerchant(orderId, merchantId);
    return ok(reply, proposals);
  });
}
