import { prisma } from "@/infrastructure/db/prisma";

export const notificationService = {
  create: (input: { accountId: string; type: string; payload: Record<string, unknown> }) =>
    prisma.notification.create({ data: input }),

  listForAccount: (accountId: string) =>
    prisma.notification.findMany({ where: { accountId }, orderBy: { createdAt: "desc" } }),
};
