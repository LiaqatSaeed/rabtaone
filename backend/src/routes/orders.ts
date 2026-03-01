import type { FastifyInstance } from "fastify";
import {
  acceptProposalSchema,
  createOrderSchema,
  submitPaymentSchema,
  updateOrderStatusSchema,
} from "@/infrastructure/validation/zod-schemas/orders";
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
    const computedTotal = data.items?.length
      ? data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : undefined;
    const accountId = req.user?.sub ?? "";
    const roles = req.user?.roles ?? null;
    requireRole(roles, ["USER"], { accountId, action: "CREATE_ORDER" });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const userId = await profileRepo.getUserProfileId(accountId);
    if (!userId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const order = await orderService.createOrder({
      userId,
      prescriptionUrl: data.prescriptionUrl,
      notes: data.notes,
      totalAmount: data.declaredTotalAmount ?? computedTotal,
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
    const roles = req.user?.roles ?? null;
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const query = req.query as { merchant?: string; limit?: string };
    const limit = query.limit ? Number(query.limit) : undefined;

    if (roles?.includes("MERCHANT") && (query.merchant === "true" || typeof query.limit !== "undefined")) {
      const merchantId = await profileRepo.getMerchantProfileId(accountId);
      if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
      const orders = await orderService.listForMerchant(merchantId, limit);
      return ok(reply, orders);
    }

    requireRole(roles, ["USER"], { accountId, action: "LIST_ORDERS" });
    const userId = await profileRepo.getUserProfileId(accountId);
    if (!userId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const orders = await orderService.listForUser(userId);
    return ok(reply, orders);
  });

  app.get("/orders/:id", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = req.user?.roles ?? null;
    const orderId = (req.params as { id: string }).id;
    const order = await accessService.assertOrderAccess({ accountId, roles, orderId });
    return ok(reply, order);
  });

  app.patch("/orders/:id/status", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(roles, ["USER", "MERCHANT", "DELIVERY"], {
      accountId,
      action: "UPDATE_ORDER_STATUS",
      resourceId: orderId,
    });
    await accessService.assertOrderAccess({ accountId, roles, orderId });

    const data = updateOrderStatusSchema.parse(req.body);
    const roleAllowed: Record<string, string[]> = {
      USER: ["CANCELLED"],
      MERCHANT: ["SYNC_PENDING", "SYNCED", "READY_FOR_DELIVERY", "CANCELLED"],
      DELIVERY: ["OUT_FOR_DELIVERY", "COMPLETED"],
    };
    const isAllowed =
      (roles?.includes("USER") && roleAllowed.USER.includes(data.status)) ||
      (roles?.includes("MERCHANT") && roleAllowed.MERCHANT.includes(data.status)) ||
      (roles?.includes("DELIVERY") && roleAllowed.DELIVERY.includes(data.status));
    if (!isAllowed) {
      logger.warn("Forbidden order status transition", {
        accountId,
        roles,
        orderId,
        targetStatus: data.status,
      });
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    let merchantId: string | undefined;
    if (roles?.includes("MERCHANT") && data.status === "ACCEPTED") {
      merchantId = await profileRepo.getMerchantProfileId(accountId);
      if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const order = await orderService.transitionStatus(orderId, data.status, merchantId);
    return ok(reply, order);
  });

  app.post("/orders/:id/accept-proposal", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(roles, ["USER"], { accountId, action: "ACCEPT_PROPOSAL", resourceId: orderId });
    await accessService.assertOrderAccess({ accountId, roles, orderId });

    const data = acceptProposalSchema.parse(req.body);
    const order = await orderService.acceptProposal({ orderId, proposalId: data.proposalId });
    return ok(reply, order);
  });

  app.post("/orders/:id/payment/submit", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(roles, ["USER"], { accountId, action: "SUBMIT_PAYMENT", resourceId: orderId });
    await accessService.assertOrderAccess({ accountId, roles, orderId });

    const data = submitPaymentSchema.parse(req.body);
    const order = await orderService.submitPayment({
      orderId,
      paymentProofFileId: data.paymentProofFileId,
      message: data.message,
    });
    return ok(reply, order);
  });

  app.post("/orders/:id/payment/verify", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(roles, ["MERCHANT"], { accountId, action: "VERIFY_PAYMENT", resourceId: orderId });

    const merchantId = await profileRepo.getMerchantProfileId(accountId);
    if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const order = await orderService.getOrder(orderId);
    if (!order || order.merchantId !== merchantId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const updated = await orderService.verifyPayment({ orderId });
    return ok(reply, updated);
  });

  app.get("/orders/:id/proposals", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    const orderId = (req.params as { id: string }).id;
    requireRole(roles, ["USER", "MERCHANT"], {
      accountId,
      action: "LIST_PROPOSALS",
      resourceId: orderId,
    });

    if (roles?.includes("USER")) {
      await accessService.assertOrderAccess({ accountId, roles, orderId });
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
