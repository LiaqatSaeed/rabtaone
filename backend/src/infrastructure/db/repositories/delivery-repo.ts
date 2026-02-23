import { prisma } from "@/infrastructure/db/prisma";

export const deliveryRepo = {
  findJobById: (id: string) =>
    prisma.deliveryJob.findUnique({ where: { id } }),
  createJob: (data: {
    orderId: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }) => prisma.deliveryJob.create({ data }),

  listOpenJobs: () =>
    prisma.deliveryJob.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" } }),

  createBid: (data: { jobId: string; courierId: string; priceCents: number }) =>
    prisma.deliveryBid.create({ data }),

  assignJob: (jobId: string, courierId: string) =>
    prisma.deliveryJob.update({ where: { id: jobId }, data: { assignedToId: courierId, status: "ASSIGNED" } }),

  addLocation: (data: { jobId: string; lat: number; lng: number }) =>
    prisma.deliveryLocation.create({ data }),
};
