import { chatRepo } from "@/infrastructure/db/repositories/chat-repo";
import { AppError } from "@/infrastructure/http/error-middleware";

export const chatService = {
  getThread: (orderId: string) => chatRepo.getOrCreateThread(orderId),
  listMessages: (threadId: string) => chatRepo.listMessages(threadId),
  addMessage: async (input: { orderId: string; threadId: string; senderId: string; body: string }) => {
    const thread = await chatRepo.getThreadById(input.threadId);
    if (!thread || thread.orderId !== input.orderId) {
      throw new AppError("Invalid thread", 400, "INVALID_THREAD");
    }
    return chatRepo.addMessage({ threadId: input.threadId, senderId: input.senderId, body: input.body });
  },
};
