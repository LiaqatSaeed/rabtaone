import type { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "@/routes/auth";
import { registerOrderRoutes } from "@/routes/orders";
import { registerProposalRoutes } from "@/routes/proposals";
import { registerDeliveryRoutes } from "@/routes/delivery";
import { registerChatRoutes } from "@/routes/chat";
import { registerNotificationRoutes } from "@/routes/notifications";
import { registerSyncRoutes } from "@/routes/sync";
import { registerRiderRoutes } from "@/routes/rider";
import { registerMetaRoutes } from "@/routes/meta";
import { registerAdminRoutes } from "@/routes/admin";
import { registerUploadRoutes } from "@/routes/uploads";
import { registerProfileRoutes } from "@/routes/profile";

export async function registerApiRoutes(app: FastifyInstance) {
  await registerAuthRoutes(app);
  await registerOrderRoutes(app);
  await registerProposalRoutes(app);
  await registerDeliveryRoutes(app);
  await registerChatRoutes(app);
  await registerNotificationRoutes(app);
  await registerSyncRoutes(app);
  await registerRiderRoutes(app);
  await registerMetaRoutes(app);
  await registerAdminRoutes(app);
  await registerUploadRoutes(app);
  await registerProfileRoutes(app);
}
