import { z } from "zod";

export const createOrderSchema = z.object({
  prescriptionUrl: z.string().url(),
  notes: z.string().max(1000).optional(),
  userLat: z.number().optional(),
  userLng: z.number().optional(),
  merchantSlug: z.string().optional(),
  shipping: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(6),
      address1: z.string().min(1),
      address2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .optional(),
  declaredTotalAmount: z.number().positive().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "REQUESTED",
    "PROPOSED",
    "ACCEPTED",
    "SYNC_PENDING",
    "SYNCED",
    "PAYMENT_PENDING",
    "PAYMENT_VERIFIED",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]),
  deliveryMode: z.enum(["RABTAONE", "OWN"]).optional(),
});

export const acceptProposalSchema = z.object({
  proposalId: z.string().min(1),
});

export const submitPaymentSchema = z
  .object({
    paymentProofFileId: z.string().min(1).optional(),
    message: z.string().min(1).max(500).optional(),
  })
  .refine((data) => data.paymentProofFileId || data.message, {
    message: "Payment proof or message is required",
  });
