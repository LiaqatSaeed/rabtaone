import { prisma } from "@/infrastructure/db/prisma";

export const profileRepo = {
  getUserProfileId: async (accountId: string) => {
    const profile = await prisma.userProfile.findUnique({ where: { accountId } });
    return profile?.id ?? null;
  },

  getMerchantProfileId: async (accountId: string) => {
    const profile = await prisma.merchantProfile.findUnique({ where: { accountId } });
    return profile?.id ?? null;
  },

  getDeliveryProfileId: async (accountId: string) => {
    const profile = await prisma.deliveryProfile.findUnique({ where: { accountId } });
    return profile?.id ?? null;
  },

  getDeliveryProfile: (accountId: string) => prisma.deliveryProfile.findUnique({ where: { accountId } }),
};
