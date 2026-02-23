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
};
