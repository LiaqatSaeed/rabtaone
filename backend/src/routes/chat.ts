import type { FastifyInstance } from "fastify";
import { chatService } from "@/services/chat-service";
import { created, ok } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";
import { accessService } from "@/services/access-service";
import { createChatMessageSchema } from "@/infrastructure/validation/zod-schemas/chat";

export async function registerChatRoutes(app: FastifyInstance) {
  app.get("/chat/threads/:orderId", async (req, reply) => {
    const orderId = (req.params as { orderId: string }).orderId;
    const accountId = req.user?.sub ?? "";
    const roles = req.user?.roles ?? null;
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    await accessService.assertOrderAccess({ accountId, roles, orderId });
    const thread = await chatService.getThread(orderId);
    const messages = await chatService.listMessages(thread.id);
    return ok(reply, { thread, messages });
  });

  app.post("/chat/messages", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = req.user?.roles ?? null;
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const data = createChatMessageSchema.parse(req.body);
    await accessService.assertOrderAccess({ accountId, roles, orderId: data.orderId });

    const message = await chatService.addMessage({
      orderId: data.orderId,
      threadId: data.threadId,
      senderId: accountId,
      body: data.body,
    });
    return created(reply, message);
  });
}
