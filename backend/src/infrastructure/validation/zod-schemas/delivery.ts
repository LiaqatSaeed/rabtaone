import { z } from "zod";

export const createDeliveryJobSchema = z.object({
  orderId: z.string().min(1),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
});

export const createDeliveryBidSchema = z.object({
  jobId: z.string().min(1),
  priceCents: z.number().int().positive(),
});
