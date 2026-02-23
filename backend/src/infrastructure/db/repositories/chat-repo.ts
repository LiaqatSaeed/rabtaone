import { prisma } from "@/infrastructure/db/prisma";

export const chatRepo = {
  getOrCreateThread: async (orderId: string) => {
    const existing = await prisma.chatThread.findFirst({ where: { orderId } });
    if (existing) return existing;
    return prisma.chatThread.create({ data: { orderId } });
  },

  getThreadById: (id: string) => prisma.chatThread.findUnique({ where: { id } }),

  addMessage: (data: { threadId: string; senderId: string; body: string }) =>
    prisma.chatMessage.create({ data }),

  listMessages: (threadId: string) =>
    prisma.chatMessage.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } }),
};
