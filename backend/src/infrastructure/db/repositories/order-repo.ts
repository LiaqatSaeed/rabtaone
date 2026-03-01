import { prisma } from "@/infrastructure/db/prisma";
import { OrderStatus } from "@prisma/client";

export const orderRepo = {
  create: (data: {
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
  }) =>
    prisma.order.create({
      data: {
        userId: data.userId,
        prescriptionUrl: data.prescriptionUrl,
        notes: data.notes,
        industryType: data.industryType,
        totalAmount: data.totalAmount,
        shipName: data.shipName,
        shipPhone: data.shipPhone,
        shipAddress1: data.shipAddress1,
        shipAddress2: data.shipAddress2,
        shipCity: data.shipCity,
        shipState: data.shipState,
        shipPostalCode: data.shipPostalCode,
        shipCountry: data.shipCountry,
        items: data.items?.length
          ? {
              create: data.items.map((item) => ({
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            }
          : undefined,
      },
    }),

  findById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: { proposals: true, statusEvents: true, deliveryJob: true, deliveryDraft: true, items: true },
    }),

  listByUser: (userId: string) =>
    prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),

  listByMerchant: (merchantId: string, limit?: number) =>
    prisma.order.findMany({
      where: { merchantId },
      include: { items: true, deliveryDraft: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  updateStatus: (id: string, status: OrderStatus) =>
    prisma.order.update({ where: { id }, data: { status } }),

  updateMerchant: (id: string, merchantId: string) =>
    prisma.order.update({ where: { id }, data: { merchantId } }),

  updateIndustryType: (id: string, industryType: string) =>
    prisma.order.update({ where: { id }, data: { industryType } }),

  addStatusEvent: (data: { orderId: string; from: OrderStatus; to: OrderStatus }) =>
    prisma.orderStatusEvent.create({ data }),
};
