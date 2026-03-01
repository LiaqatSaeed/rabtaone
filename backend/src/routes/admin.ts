import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { ok } from "@/infrastructure/http/response";
import { requireRole } from "@/infrastructure/http/require-role";

const listQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.string().optional(),
});

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/admin/overview", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["ADMIN"], { accountId, action: "ADMIN_OVERVIEW" });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [ordersToday, pendingPayment, syncPending, syncFailed, draftsOpen, draftsAssigned] =
      await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.order.count({ where: { status: "PAYMENT_PENDING" } }),
        prisma.syncRequest.count({ where: { status: "PENDING" } }),
        prisma.syncRequest.count({ where: { status: "FAILED" } }),
        prisma.deliveryDraft.count({ where: { status: "OPEN" } }),
        prisma.deliveryDraft.count({ where: { status: "ASSIGNED" } }),
      ]);

    return ok(reply, {
      ordersToday,
      pendingPayment,
      syncPending,
      syncFailed,
      draftsOpen,
      draftsAssigned,
    });
  });

  app.get("/admin/orders", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["ADMIN"], { accountId, action: "ADMIN_LIST_ORDERS" });

    const query = listQuerySchema.parse(req.query);
    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const where = query.status ? { status: query.status as string } : {};

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: true,
        merchant: true,
      },
    });

    return ok(reply, orders);
  });

  app.get("/admin/sync", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["ADMIN"], { accountId, action: "ADMIN_LIST_SYNC" });

    const query = listQuerySchema.parse(req.query);
    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const where = query.status ? { status: query.status as string } : {};

    const syncRequests = await prisma.syncRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { order: true, merchant: true },
    });

    return ok(reply, syncRequests);
  });

  app.get("/admin/delivery-drafts", async (req, reply) => {
    const roles = req.user?.roles ?? null;
    const accountId = req.user?.sub ?? "";
    requireRole(roles, ["ADMIN"], { accountId, action: "ADMIN_LIST_DRAFTS" });

    const query = listQuerySchema.parse(req.query);
    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const where = query.status ? { status: query.status as string } : {};

    const drafts = await prisma.deliveryDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { order: true, rider: true },
    });

    return ok(reply, drafts);
  });
}
