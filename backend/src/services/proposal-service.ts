import { proposalRepo } from "@/infrastructure/db/repositories/proposal-repo";
import { orderRepo } from "@/infrastructure/db/repositories/order-repo";
import { AppError } from "@/infrastructure/http/error-middleware";

export const proposalService = {
  createProposal: async (input: {
    orderId: string;
    merchantId: string;
    priceCents: number;
    availability: string;
    deliveryOption: string;
  }) => {
    const order = await orderRepo.findById(input.orderId);
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (!["REQUESTED", "PROPOSED"].includes(order.status)) {
      throw new AppError("Order not open for proposals", 409, "ORDER_NOT_OPEN");
    }
    return proposalRepo.create(input);
  },

  listForOrder: (orderId: string) => proposalRepo.listByOrder(orderId),
};
