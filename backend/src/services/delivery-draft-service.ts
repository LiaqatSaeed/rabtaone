import { prisma } from "@/infrastructure/db/prisma";
import { deliveryDraftRepo } from "@/infrastructure/db/repositories/delivery-draft-repo";
import { AppError } from "@/infrastructure/http/error-middleware";
import { DeliveryStatus } from "@prisma/client";

export const deliveryDraftService = {
  async createForOrder(orderId: string) {
    return deliveryDraftRepo.create({ orderId });
  },

  listOpenDrafts() {
    return deliveryDraftRepo.listOpen();
  },
  listAssignedDrafts(riderId: string) {
    return deliveryDraftRepo.listForRider(riderId, ["ASSIGNED", "PICKED"]);
  },

  async acceptDraft(draftId: string, riderId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryDraft.updateMany({
        where: { id: draftId, status: "OPEN" },
        data: { riderId, status: "ASSIGNED" },
      });

      if (updated.count === 1) {
        return tx.deliveryDraft.findUnique({ where: { id: draftId } });
      }

      const draft = await tx.deliveryDraft.findUnique({ where: { id: draftId } });
      if (!draft) throw new AppError("Draft not found", 404, "DRAFT_NOT_FOUND");
      if (draft.status === "ASSIGNED") {
        throw new AppError("Draft already assigned", 409, "DRAFT_ALREADY_ASSIGNED", {
          riderId: draft.riderId,
        });
      }
      throw new AppError("Draft not open", 409, "DRAFT_NOT_OPEN");
    });
  },

  async updateStatus(draftId: string, riderId: string, status: DeliveryStatus) {
    const draft = await deliveryDraftRepo.findById(draftId);
    if (!draft) throw new AppError("Draft not found", 404, "DRAFT_NOT_FOUND");
    if (draft.status === "DELIVERED") return draft;
    if (draft.riderId !== riderId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const allowed: Record<DeliveryStatus, DeliveryStatus[]> = {
      OPEN: [],
      ASSIGNED: ["PICKED"],
      PICKED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!allowed[draft.status].includes(status)) {
      throw new AppError("Invalid status transition", 409, "INVALID_DRAFT_TRANSITION");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryDraft.update({ where: { id: draftId }, data: { status } });
      if (status === "DELIVERED") {
        const order = await tx.order.findUnique({ where: { id: draft.orderId } });
        if (order && order.status !== "COMPLETED") {
          await tx.order.update({ where: { id: draft.orderId }, data: { status: "COMPLETED" } });
          await tx.orderStatusEvent.create({
            data: { orderId: draft.orderId, from: order.status, to: "COMPLETED" },
          });
        }
      }
      return updated;
    });
  },
};
