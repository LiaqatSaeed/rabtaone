import type { FastifyInstance } from "fastify";
import { createProposalSchema } from "@/infrastructure/validation/zod-schemas/proposals";
import { proposalService } from "@/services/proposal-service";
import { created } from "@/infrastructure/http/response";
import { requireRole } from "@/infrastructure/http/require-role";
import { AppError } from "@/infrastructure/http/error-middleware";
import { profileRepo } from "@/infrastructure/db/repositories/profile-repo";
import { logger } from "@/lib/logger";

export async function registerProposalRoutes(app: FastifyInstance) {
  app.post("/proposals", async (req, reply) => {
    const data = createProposalSchema.parse(req.body);
    const accountId = req.user?.sub ?? "";
    const roles = req.user?.roles ?? null;
    requireRole(roles, ["MERCHANT"], {
      accountId,
      action: "CREATE_PROPOSAL",
      resourceId: data.orderId,
    });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const merchantId = await profileRepo.getMerchantProfileId(accountId);
    if (!merchantId) {
      logger.warn("Forbidden proposal creation - no merchant profile", { accountId });
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    const proposal = await proposalService.createProposal({
      ...data,
      merchantId,
    });
    return created(reply, proposal);
  });
}
