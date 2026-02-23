import { AppError } from "@/infrastructure/http/error-middleware";
import { orderRepo } from "@/infrastructure/db/repositories/order-repo";
import { profileRepo } from "@/infrastructure/db/repositories/profile-repo";
import { logger } from "@/lib/logger";

export const accessService = {
  async assertOrderAccess(input: {
    accountId: string;
    role: string | null;
    orderId: string;
  }) {
    const { accountId, role, orderId } = input;
    if (!accountId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (!role) {
      logger.warn("Forbidden order access", { accountId, role, orderId, reason: "ROLE_MISSING" });
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const order = await orderRepo.findById(orderId);
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

    if (role === "USER") {
      const userId = await profileRepo.getUserProfileId(accountId);
      if (!userId || order.userId !== userId) {
        logger.warn("Forbidden order access", { accountId, role, orderId, reason: "USER_MISMATCH" });
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }
      return order;
    }

    if (role === "MERCHANT") {
      const merchantId = await profileRepo.getMerchantProfileId(accountId);
      if (!merchantId || order.merchantId !== merchantId) {
        logger.warn("Forbidden order access", { accountId, role, orderId, reason: "MERCHANT_MISMATCH" });
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }
      return order;
    }

    if (role === "DELIVERY") {
      const courierId = await profileRepo.getDeliveryProfileId(accountId);
      if (!courierId || order.deliveryJob?.assignedToId !== courierId) {
        logger.warn("Forbidden order access", { accountId, role, orderId, reason: "DELIVERY_MISMATCH" });
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }
      return order;
    }

    throw new AppError("Forbidden", 403, "FORBIDDEN");
  },
};
