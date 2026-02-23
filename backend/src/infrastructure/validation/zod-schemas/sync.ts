import { z } from "zod";

export const confirmSyncSchema = z.object({
  invoiceNumber: z.string().min(1),
  totalAmount: z.number().positive(),
});
