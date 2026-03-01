import { prisma } from "@/infrastructure/db/prisma";
import { DeliveryStatus } from "@prisma/client";

export const deliveryDraftRepo = {
  create: (data: { orderId: string }) =>
    prisma.deliveryDraft.create({ data }),

  listOpen: () =>
    prisma.deliveryDraft.findMany({
      where: { status: DeliveryStatus.OPEN },
      include: { order: true },
      orderBy: { createdAt: "asc" },
    }),
  listForRider: (riderId: string, statuses: DeliveryStatus[]) =>
    prisma.deliveryDraft.findMany({
      where: {
        riderId,
        status: { in: statuses },
      },
      include: { order: true },
      orderBy: { updatedAt: "desc" },
    }),

  findById: (id: string) =>
    prisma.deliveryDraft.findUnique({ where: { id }, include: { order: true } }),

  assign: (id: string, riderId: string) =>
    prisma.deliveryDraft.update({
      where: { id },
      data: { riderId, status: DeliveryStatus.ASSIGNED },
    }),

  updateStatus: (id: string, status: DeliveryStatus) =>
    prisma.deliveryDraft.update({ where: { id }, data: { status } }),
};
