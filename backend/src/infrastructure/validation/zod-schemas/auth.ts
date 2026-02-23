import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  role: z.enum(["USER", "MERCHANT", "DELIVERY"]),
  fullName: z.string().min(2).optional(),
  businessName: z.string().min(2).optional(),
  industryType: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
