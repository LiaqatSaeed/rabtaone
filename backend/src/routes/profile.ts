import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { uploadFile } from "@/lib/storage";
import { ok } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const updateUserSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  defaultLat: z.number().optional(),
  defaultLng: z.number().optional(),
});

const updateMerchantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  serviceKm: z.number().int().min(1).max(100).optional(),
  hasDelivery: z.boolean().optional(),
});

const updateDeliverySchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
  isOnline: z.boolean().optional(),
});

export async function registerProfileRoutes(app: FastifyInstance) {
  // GET /me — return profile based on caller's role
  app.get("/me", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = (req.user?.roles ?? []) as string[];
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { userProfile: true, merchantProfile: true, deliveryProfile: true },
    });
    if (!account) throw new AppError("Account not found", 404, "NOT_FOUND");

    const profile =
      account.userProfile ?? account.merchantProfile ?? account.deliveryProfile ?? null;

    return ok(reply, {
      id: account.id,
      email: account.email,
      roles: account.roles,
      profile,
    });
  });

  // PATCH /me — update text fields
  app.patch("/me", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = (req.user?.roles ?? []) as string[];
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    if (roles.includes("USER")) {
      const data = updateUserSchema.parse(req.body);
      const profile = await prisma.userProfile.update({
        where: { accountId },
        data,
      });
      return ok(reply, profile);
    }

    if (roles.includes("MERCHANT")) {
      const data = updateMerchantSchema.parse(req.body);
      const profile = await prisma.merchantProfile.update({
        where: { accountId },
        data,
      });
      return ok(reply, profile);
    }

    if (roles.includes("DELIVERY")) {
      const data = updateDeliverySchema.parse(req.body);
      const profile = await prisma.deliveryProfile.update({
        where: { accountId },
        data,
      });
      return ok(reply, profile);
    }

    throw new AppError("No profile for this role", 400, "NO_PROFILE");
  });

  // POST /me/avatar — upload avatar/logo image
  app.post("/me/avatar", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = (req.user?.roles ?? []) as string[];
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const file = await req.file({ limits: { fileSize: MAX_SIZE_BYTES } });
    if (!file) throw new AppError("No file provided", 400, "MISSING_FILE");

    const buffer = await file.toBuffer();

    let folder: string;
    if (roles.includes("USER")) folder = "users/avatars";
    else if (roles.includes("MERCHANT")) folder = "merchants/logos";
    else if (roles.includes("DELIVERY")) folder = "riders/avatars";
    else throw new AppError("No profile for this role", 400, "NO_PROFILE");

    const { url } = await uploadFile({
      buffer,
      folder,
      filename: file.filename,
      contentType: file.mimetype,
    });

    if (roles.includes("USER")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile: any = await (prisma.userProfile.update as any)({
        where: { accountId },
        data: { avatarUrl: url },
      });
      return ok(reply, { avatarUrl: profile.avatarUrl });
    }

    if (roles.includes("MERCHANT")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile: any = await (prisma.merchantProfile.update as any)({
        where: { accountId },
        data: { logoUrl: url },
      });
      return ok(reply, { logoUrl: profile.logoUrl });
    }

    if (roles.includes("DELIVERY")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile: any = await (prisma.deliveryProfile.update as any)({
        where: { accountId },
        data: { avatarUrl: url },
      });
      return ok(reply, { avatarUrl: profile.avatarUrl });
    }
  });

  // POST /me/banner — merchant-only banner image
  app.post("/me/banner", async (req, reply) => {
    const accountId = req.user?.sub ?? "";
    const roles = (req.user?.roles ?? []) as string[];
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (!roles.includes("MERCHANT")) throw new AppError("Merchant only", 403, "FORBIDDEN");

    const file = await req.file({ limits: { fileSize: MAX_SIZE_BYTES } });
    if (!file) throw new AppError("No file provided", 400, "MISSING_FILE");

    const buffer = await file.toBuffer();
    const { url } = await uploadFile({
      buffer,
      folder: "merchants/banners",
      filename: file.filename,
      contentType: file.mimetype,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile: any = await (prisma.merchantProfile.update as any)({
      where: { accountId },
      data: { bannerUrl: url },
    });

    return ok(reply, { bannerUrl: profile.bannerUrl });
  });
}
