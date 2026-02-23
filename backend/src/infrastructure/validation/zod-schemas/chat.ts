import { z } from "zod";

export const createChatMessageSchema = z.object({
  orderId: z.string().min(1),
  threadId: z.string().min(1),
  body: z.string().min(1).max(2000),
});
