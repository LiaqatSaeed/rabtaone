import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { uploadFile } from "@/lib/storage";
import { prisma } from "@/infrastructure/db/prisma";
import { created } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";
import { accessService } from "@/services/access-service";

const ALLOWED_FOLDERS = {
  "orders/prescriptions": "orders/prescriptions",
  "payments/proofs": "payments/proofs",
  "merchants/branding": "merchants/branding",
} as const;

const querySchema = z.object({
  folder: z.enum(["orders/prescriptions", "payments/proofs", "merchants/branding"]),
  orderId: z.string().optional(),
});

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function registerUploadRoutes(app: FastifyInstance) {
  app.post("/uploads", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = req.user?.roles ?? null;
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const query = querySchema.parse(req.query);
    const folder = ALLOWED_FOLDERS[query.folder];

    if (query.orderId) {
      await accessService.assertOrderAccess({ accountId, roles, orderId: query.orderId });
    }

    const file = await req.file({ limits: { fileSize: MAX_SIZE_BYTES } });
    if (!file) throw new AppError("No file provided", 400, "MISSING_FILE");

    const buffer = await file.toBuffer();
    const { url, storageKey } = await uploadFile({
      buffer,
      folder,
      filename: file.filename,
      contentType: file.mimetype,
    });

    const uploaded = await prisma.uploadedFile.create({
      data: {
        orderId: query.orderId,
        url,
        storageType: "s3",
        storageKey,
      },
    });

    return created(reply, uploaded);
  });
}
