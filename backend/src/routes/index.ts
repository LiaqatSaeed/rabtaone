import type { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "@/routes/auth";
import { registerOrderRoutes } from "@/routes/orders";
import { registerProposalRoutes } from "@/routes/proposals";
import { registerDeliveryRoutes } from "@/routes/delivery";
import { registerChatRoutes } from "@/routes/chat";
import { registerNotificationRoutes } from "@/routes/notifications";
import { registerSyncRoutes } from "@/routes/sync";

export async function registerApiRoutes(app: FastifyInstance) {
  await registerAuthRoutes(app);
  await registerOrderRoutes(app);
  await registerProposalRoutes(app);
  await registerDeliveryRoutes(app);
  await registerChatRoutes(app);
  await registerNotificationRoutes(app);
  await registerSyncRoutes(app);
}
