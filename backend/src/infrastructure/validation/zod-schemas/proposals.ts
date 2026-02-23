import { z } from "zod";

export const createProposalSchema = z.object({
  orderId: z.string().min(1),
  priceCents: z.number().int().positive(),
  availability: z.string().min(1),
  deliveryOption: z.string().min(1),
});
