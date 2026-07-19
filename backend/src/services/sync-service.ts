import { prisma } from "@/infrastructure/db/prisma";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { syncRequestRepo } from "@/infrastructure/db/repositories/sync-request-repo";
import { AppError } from "@/infrastructure/http/error-middleware";
import { randomUUID } from "crypto";

export type SyncPayload = {
  orderId: string;
  status: string;
  data: Record<string, unknown>;
};

export const syncService = {
  async enqueueOrderSync(payload: SyncPayload) {
    return prisma.syncEvent.create({
      data: { orderId: payload.orderId, status: payload.status, payload: payload.data },
    });
  },

  async sendOrder(payload: SyncPayload) {
    if (!env.ERP_BASE_URL || !env.ERP_API_KEY) {
      logger.warn("ERP not configured; skipping send", { orderId: payload.orderId });
      return { skipped: true };
    }

    try {
      const res = await fetch(`${env.ERP_BASE_URL}/api/sync/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ERP_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      return { ok: res.ok, status: res.status };
    } catch (err) {
      logger.warn("ERP send failed", { orderId: payload.orderId, err: err instanceof Error ? err.message : err });
      throw new AppError("ERP is unreachable. Check ERP_BASE_URL configuration.", 502, "ERP_UNREACHABLE");
    }
  },

  async handleWebhook(payload: Record<string, unknown>) {
    logger.info("ERP webhook received", { payload });
    return { ok: true };
  },

  async createSyncRequest(input: { orderId: string; merchantId: string }) {
    const exists = await syncRequestRepo.existsForOrder(input.orderId);
    if (exists) return null;

    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { user: { include: { account: true } }, items: true },
    });
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: input.merchantId },
    });
    if (!merchant) throw new AppError("Merchant not found", 404, "MERCHANT_NOT_FOUND");

    const syncId = randomUUID();
    const payload = {
      syncId,
      merchantId: input.merchantId,
      industryType: merchant.industryType,
      createdAt: new Date().toISOString(),
      order: {
        id: order.id,
        items: order.items.map((item) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        totalAmount:
          order.totalAmount ??
          order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        customer: {
          name: order.user.fullName,
          phone: order.user.account.phone ?? null,
        },
        shipping: {
          name: order.shipName ?? order.user.fullName,
          phone: order.shipPhone ?? order.user.account.phone ?? null,
          address1: order.shipAddress1 ?? null,
          address2: order.shipAddress2 ?? null,
          city: order.shipCity ?? null,
          state: order.shipState ?? null,
          postalCode: order.shipPostalCode ?? null,
          country: order.shipCountry ?? null,
        },
      },
    };

    return syncRequestRepo.create({
      id: syncId,
      orderId: input.orderId,
      merchantId: input.merchantId,
      industryType: merchant.industryType,
      payload,
    });
  },

  async listPendingByMerchant(merchantId: string) {
    const requests = await syncRequestRepo.findPendingByMerchant(merchantId);
    return requests.map((req) => req.payload);
  },

  async listByMerchant(merchantId: string, statuses: ("PENDING" | "SYNCED" | "FAILED")[]) {
    const requests = await syncRequestRepo.findByMerchant(merchantId, statuses);
    return requests.map((req) => ({
      ...(req.payload as Record<string, unknown>),
      status: req.status,
      invoiceNumber: req.invoiceNumber,
      totalAmount: req.totalAmount,
      createdAt: req.createdAt,
    }));
  },

  async confirmSync(input: { syncRequestId: string; merchantId: string; invoiceNumber: string; totalAmount: number }) {
    const syncRequest = await syncRequestRepo.findById(input.syncRequestId);
    if (!syncRequest) throw new AppError("Sync request not found", 404, "SYNC_REQUEST_NOT_FOUND");
    if (syncRequest.merchantId !== input.merchantId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    if (syncRequest.status === "SYNCED") {
      return syncRequest;
    }
    if (syncRequest.status !== "PENDING") {
      throw new AppError("Invalid sync request status", 409, "INVALID_SYNC_STATUS");
    }

    await syncRequestRepo.updateToSynced(input.syncRequestId, {
      invoiceNumber: input.invoiceNumber,
      totalAmount: input.totalAmount,
    });

    const order = await prisma.order.findUnique({ where: { id: syncRequest.orderId } });
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    const fromStatus = order.status;

    await prisma.order.update({
      where: { id: syncRequest.orderId },
      data: { status: "SYNCED" },
    });

    await prisma.orderStatusEvent.create({
      data: { orderId: syncRequest.orderId, from: fromStatus, to: "SYNCED" },
    });

    return syncRequestRepo.findById(input.syncRequestId);
  },
};
