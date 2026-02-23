import { deliveryRepo } from "@/infrastructure/db/repositories/delivery-repo";
import { AppError } from "@/infrastructure/http/error-middleware";

export const deliveryService = {
  createJob: (input: {
    orderId: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }) => deliveryRepo.createJob(input),

  listOpenJobs: () => deliveryRepo.listOpenJobs(),

  createBid: async (input: { jobId: string; courierId: string; priceCents: number }) => {
    const job = await deliveryRepo.findJobById(input.jobId);
    if (!job) throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
    if (job.status !== "OPEN") throw new AppError("Job not open", 409, "JOB_NOT_OPEN");
    return deliveryRepo.createBid(input);
  },

  assignJob: (jobId: string, courierId: string) => deliveryRepo.assignJob(jobId, courierId),

  addLocation: (input: { jobId: string; lat: number; lng: number }) =>
    deliveryRepo.addLocation(input),
};
