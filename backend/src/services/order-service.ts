import { OrderStatus } from "@prisma/client";
import { orderRepo } from "@/infrastructure/db/repositories/order-repo";
import { AppError } from "@/infrastructure/http/error-middleware";
import { syncService } from "@/services/sync-service";
import { prisma } from "@/infrastructure/db/prisma";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  REQUESTED: ["PROPOSED", "CANCELLED"],
  PROPOSED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["SYNC_PENDING", "SYNCED", "CANCELLED"],
  SYNC_PENDING: ["SYNCED", "CANCELLED"],
  SYNCED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const orderService = {
  createOrder: (input: {
    userId: string;
    prescriptionUrl: string;
    notes?: string;
    industryType?: string;
    totalAmount?: number;
    shipName?: string;
    shipPhone?: string;
    shipAddress1?: string;
    shipAddress2?: string;
    shipCity?: string;
    shipState?: string;
    shipPostalCode?: string;
    shipCountry?: string;
    items?: { sku: string; name: string; quantity: number; unitPrice: number }[];
  }) => orderRepo.create(input),

  getOrder: (id: string) => orderRepo.findById(id),

  listForUser: (userId: string) => orderRepo.listByUser(userId),

  listForMerchant: (merchantId: string, limit?: number) =>
    orderRepo.listByMerchant(merchantId, limit),

  async transitionStatus(orderId: string, to: OrderStatus, merchantId?: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

    const from = order.status;
    const allowed = allowedTransitions[from] ?? [];
    if (!allowed.includes(to)) {
      throw new AppError("Invalid order status transition", 409, "INVALID_TRANSITION");
    }

    if (merchantId && !order.merchantId) {
      await orderRepo.updateMerchant(orderId, merchantId);
    }
    await orderRepo.updateStatus(orderId, to);
    await orderRepo.addStatusEvent({ orderId, from, to });

    if (to === "ACCEPTED") {
      const resolvedMerchantId = order.merchantId ?? merchantId;
      if (!resolvedMerchantId) {
        throw new AppError("Missing merchant for order", 409, "MISSING_MERCHANT");
      }
      if (!order.industryType) {
        const merchant = await prisma.merchantProfile.findUnique({ where: { id: resolvedMerchantId } });
        if (merchant) {
          await orderRepo.updateIndustryType(orderId, merchant.industryType);
        }
      }
      await syncService.createSyncRequest({
        orderId: order.id,
        merchantId: resolvedMerchantId,
      });
    }

    return orderRepo.findById(orderId);
  },
};
