import type { FastifyInstance } from "fastify";
import { requireRole } from "@/infrastructure/http/require-role";
import { AppError } from "@/infrastructure/http/error-middleware";
import { deliveryDraftService } from "@/services/delivery-draft-service";
import { profileRepo } from "@/infrastructure/db/repositories/profile-repo";
import { ok } from "@/infrastructure/http/response";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["PICKED", "DELIVERED"]) });
const listQuerySchema = z.object({ scope: z.enum(["open", "assigned"]).optional() });

export async function registerRiderRoutes(app: FastifyInstance) {
  app.get("/rider/drafts", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["DELIVERY"], { accountId, action: "LIST_DRAFTS" });
    const query = listQuerySchema.parse(req.query);
    if (query.scope === "assigned") {
      const riderId = await profileRepo.getDeliveryProfileId(accountId);
      if (!riderId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
      const drafts = await deliveryDraftService.listAssignedDrafts(riderId);
      return ok(reply, drafts);
    }
    const drafts = await deliveryDraftService.listOpenDrafts();
    return ok(reply, drafts);
  });

  app.post("/rider/drafts/:id/accept", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["DELIVERY"], { accountId, action: "ACCEPT_DRAFT" });

    const riderId = await profileRepo.getDeliveryProfileId(accountId);
    if (!riderId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");

    const draftId = (req.params as { id: string }).id;
    const draft = await deliveryDraftService.acceptDraft(draftId, riderId);
    return ok(reply, draft);
  });

  app.patch("/rider/drafts/:id/status", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["DELIVERY"], { accountId, action: "UPDATE_DRAFT_STATUS" });

    const riderId = await profileRepo.getDeliveryProfileId(accountId);
    if (!riderId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");

    const draftId = (req.params as { id: string }).id;
    const data = statusSchema.parse(req.body);
    const draft = await deliveryDraftService.updateStatus(draftId, riderId, data.status);
    return ok(reply, draft);
  });
}
