import { prisma } from "@/infrastructure/db/prisma";
import { SyncStatus } from "@prisma/client";

export const syncRequestRepo = {
  create: (data: {
    id?: string;
    orderId: string;
    merchantId: string;
    industryType: string;
    payload: Record<string, unknown>;
  }) => prisma.syncRequest.create({ data }),

  findPendingByMerchant: (merchantId: string) =>
    prisma.syncRequest.findMany({
      where: { merchantId, status: SyncStatus.PENDING },
      orderBy: { createdAt: "asc" },
    }),

  findByMerchant: (merchantId: string, statuses: SyncStatus[]) =>
    prisma.syncRequest.findMany({
      where: { merchantId, status: { in: statuses } },
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: string) =>
    prisma.syncRequest.findUnique({
      where: { id },
    }),

  updateToSynced: (id: string, data: { invoiceNumber: string; totalAmount: number }) =>
    prisma.syncRequest.update({
      where: { id },
      data: {
        status: SyncStatus.SYNCED,
        invoiceNumber: data.invoiceNumber,
        totalAmount: data.totalAmount,
      },
    }),

  existsForOrder: async (orderId: string) => {
    const count = await prisma.syncRequest.count({ where: { orderId } });
    return count > 0;
  },
};
