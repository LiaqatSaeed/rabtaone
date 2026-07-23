import type { FastifyInstance } from "fastify";
import { prisma } from "@/infrastructure/db/prisma";
import { ok } from "@/infrastructure/http/response";
import { AppError } from "@/infrastructure/http/error-middleware";

export async function registerPublicRoutes(app: FastifyInstance) {
  app.get("/public/merchants/:slug", async (req, reply) => {
    const slug = (req.params as { slug: string }).slug;
    const merchant = await prisma.merchantProfile.findUnique({ where: { slug } });
    if (!merchant) throw new AppError("Merchant not found", 404, "MERCHANT_NOT_FOUND");

    return ok(reply, {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      description: merchant.description,
      industryType: merchant.industryType,
      lat: merchant.lat,
      lng: merchant.lng,
      serviceKm: merchant.serviceKm,
      hasDelivery: merchant.hasDelivery,
      logoUrl: merchant.logoUrl,
      bannerUrl: merchant.bannerUrl,
      whatsapp: merchant.whatsapp,
      categories: merchant.categories,
    });
  });
}
