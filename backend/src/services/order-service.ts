import { OrderStatus } from "@prisma/client";
import { orderRepo } from "@/infrastructure/db/repositories/order-repo";
import { AppError } from "@/infrastructure/http/error-middleware";
import { syncService } from "@/services/sync-service";
import { prisma } from "@/infrastructure/db/prisma";
import { randomUUID } from "crypto";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  REQUESTED: ["PROPOSED", "CANCELLED"],
  PROPOSED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["SYNC_PENDING", "SYNCED", "CANCELLED"],
  SYNC_PENDING: ["SYNCED", "CANCELLED"],
  SYNCED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_VERIFIED", "CANCELLED"],
  PAYMENT_VERIFIED: ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "CANCELLED"],
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
    if (to === "READY_FOR_DELIVERY") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: to } });
        await tx.orderStatusEvent.create({ data: { orderId, from, to } });
        await tx.deliveryDraft.upsert({
          where: { orderId },
          create: { orderId },
          update: {},
        });
      });
    } else {
      await orderRepo.updateStatus(orderId, to);
      await orderRepo.addStatusEvent({ orderId, from, to });
    }

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

  async acceptProposal(input: { orderId: string; proposalId: string }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: { items: true, user: { include: { account: true } } },
      });
      if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
      if (order.status !== "REQUESTED") {
        throw new AppError("Order not open for acceptance", 409, "ORDER_NOT_OPEN");
      }

      const proposal = await tx.proposal.findUnique({ where: { id: input.proposalId } });
      if (!proposal || proposal.orderId !== input.orderId) {
        throw new AppError("Proposal not found", 404, "PROPOSAL_NOT_FOUND");
      }
      if (proposal.status !== "PENDING") {
        throw new AppError("Proposal already processed", 409, "PROPOSAL_NOT_PENDING");
      }

      const merchant = await tx.merchantProfile.findUnique({ where: { id: proposal.merchantId } });
      if (!merchant) throw new AppError("Merchant not found", 404, "MERCHANT_NOT_FOUND");

      const updatedOrder = await tx.order.updateMany({
        where: { id: input.orderId, status: "REQUESTED" },
        data: { merchantId: proposal.merchantId, status: "ACCEPTED" },
      });
      if (updatedOrder.count === 0) {
        throw new AppError("Order already accepted", 409, "ORDER_ALREADY_ACCEPTED");
      }

      const existingSync = await tx.syncRequest.findFirst({ where: { orderId: order.id } });
      if (existingSync) {
        throw new AppError("Sync request already exists", 409, "SYNC_ALREADY_EXISTS");
      }

      await tx.proposal.update({ where: { id: proposal.id }, data: { status: "ACCEPTED" } });
      await tx.proposal.updateMany({
        where: { orderId: input.orderId, id: { not: proposal.id } },
        data: { status: "REJECTED" },
      });
      await tx.orderStatusEvent.create({
        data: { orderId: input.orderId, from: order.status, to: "ACCEPTED" },
      });

      const syncId = randomUUID();
      const payload = {
        syncId,
        merchantId: proposal.merchantId,
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

      await tx.syncRequest.create({
        data: {
          id: syncId,
          orderId: order.id,
          merchantId: proposal.merchantId,
          industryType: merchant.industryType,
          payload,
          status: "PENDING",
        },
      });

      return tx.order.findUnique({ where: { id: order.id } });
    });
  },

  async submitPayment(input: { orderId: string; paymentProofFileId?: string; message?: string }) {
    const order = await orderRepo.findById(input.orderId);
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (order.status === "PAYMENT_PENDING") return order;
    if (order.status !== "SYNCED") {
      throw new AppError("Order not ready for payment", 409, "PAYMENT_NOT_ALLOWED");
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: "PAYMENT_PENDING",
          paymentProofFileId: input.paymentProofFileId ?? null,
          paymentNote: input.message ?? null,
        },
      });
      await tx.orderStatusEvent.create({
        data: { orderId: input.orderId, from: order.status, to: "PAYMENT_PENDING" },
      });
    });

    return orderRepo.findById(input.orderId);
  },

  async verifyPayment(input: { orderId: string }) {
    const order = await orderRepo.findById(input.orderId);
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (order.status === "PAYMENT_VERIFIED") return order;
    if (order.status !== "PAYMENT_PENDING") {
      throw new AppError("Order not pending payment", 409, "PAYMENT_NOT_PENDING");
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: input.orderId }, data: { status: "PAYMENT_VERIFIED" } });
      await tx.orderStatusEvent.create({
        data: { orderId: input.orderId, from: order.status, to: "PAYMENT_VERIFIED" },
      });
    });

    return orderRepo.findById(input.orderId);
  },
};
