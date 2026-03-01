import { prisma } from "@/infrastructure/db/prisma";

export const proposalRepo = {
  create: (data: {
    orderId: string;
    merchantId: string;
    priceCents: number;
    availability: string;
    deliveryOption: string;
  }) => prisma.proposal.create({ data }),

  listByOrder: (orderId: string) =>
    prisma.proposal.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } }),

  listByOrderAndMerchant: (orderId: string, merchantId: string) =>
    prisma.proposal.findMany({
      where: { orderId, merchantId },
      orderBy: { createdAt: "asc" },
    }),

  hasForOrderAndMerchant: async (orderId: string, merchantId: string) => {
    const count = await prisma.proposal.count({ where: { orderId, merchantId } });
    return count > 0;
  },

  findById: (id: string) => prisma.proposal.findUnique({ where: { id } }),

  acceptAndRejectOthers: async (orderId: string, proposalId: string) => {
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: "ACCEPTED" } });
    await prisma.proposal.updateMany({
      where: { orderId, id: { not: proposalId } },
      data: { status: "REJECTED" },
    });
  },
};
