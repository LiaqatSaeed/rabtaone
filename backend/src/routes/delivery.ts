import type { FastifyInstance } from "fastify";
import { createDeliveryJobSchema, createDeliveryBidSchema } from "@/infrastructure/validation/zod-schemas/delivery";
import { deliveryService } from "@/services/delivery-service";
import { created, ok } from "@/infrastructure/http/response";
import { requireRole } from "@/infrastructure/http/require-role";
import { AppError } from "@/infrastructure/http/error-middleware";
import { accessService } from "@/services/access-service";
import { profileRepo } from "@/infrastructure/db/repositories/profile-repo";
import { deliveryRepo } from "@/infrastructure/db/repositories/delivery-repo";
import { orderRepo } from "@/infrastructure/db/repositories/order-repo";
import { logger } from "@/lib/logger";

export async function registerDeliveryRoutes(app: FastifyInstance) {
  app.post("/delivery/jobs", async (req, reply) => {
    const data = createDeliveryJobSchema.parse(req.body);
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(role, ["USER", "MERCHANT"], {
      accountId,
      action: "CREATE_DELIVERY_JOB",
      resourceId: data.orderId,
    });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    await accessService.assertOrderAccess({ accountId, role, orderId: data.orderId });
    const job = await deliveryService.createJob(data);
    return created(reply, job);
  });

  app.get("/delivery/jobs", async (req, reply) => {
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(role, ["DELIVERY"], { accountId, action: "LIST_DELIVERY_JOBS" });
    const jobs = await deliveryService.listOpenJobs();
    return ok(reply, jobs);
  });

  app.post("/delivery/jobs/:id/bids", async (req, reply) => {
    const jobId = (req.params as { id: string }).id;
    const data = createDeliveryBidSchema.parse({ ...req.body, jobId });
    const accountId = req.user?.sub ?? "";
    const role = req.user?.role ?? null;
    requireRole(role, ["DELIVERY"], {
      accountId,
      action: "CREATE_DELIVERY_BID",
      resourceId: jobId,
    });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const courierId = await profileRepo.getDeliveryProfileId(accountId);
    if (!courierId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    const bid = await deliveryService.createBid({
      jobId: data.jobId,
      courierId,
      priceCents: data.priceCents,
    });
    return created(reply, bid);
  });

  app.post("/delivery/jobs/:id/assign", async (req, reply) => {
    const jobId = (req.params as { id: string }).id;
    const role = req.user?.role ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(role, ["MERCHANT"], {
      accountId,
      action: "ASSIGN_DELIVERY_JOB",
      resourceId: jobId,
    });
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const merchantId = await profileRepo.getMerchantProfileId(accountId);
    if (!merchantId) throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");

    const body = req.body as { courierId?: string };
    const courierId = body.courierId ?? "";
    if (!courierId) throw new AppError("Missing courierId", 400, "MISSING_COURIER");

    const job = await deliveryRepo.findJobById(jobId);
    if (!job) throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
    const order = await orderRepo.findById(job.orderId);
    if (!order || order.merchantId !== merchantId) {
      logger.warn("Forbidden delivery assignment", { accountId, merchantId, orderId: job.orderId });
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const updated = await deliveryService.assignJob(jobId, courierId);
    return ok(reply, updated);
  });
}
