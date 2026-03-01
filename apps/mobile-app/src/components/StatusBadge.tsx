import { Badge } from "@rabtaone/ui";
import type { OrderStatus } from "@rabtaone/types";

const map: Record<OrderStatus, "neutral" | "warning" | "success" | "danger" | "primary"> = {
  REQUESTED: "neutral",
  PROPOSED: "neutral",
  ACCEPTED: "warning",
  SYNC_PENDING: "warning",
  SYNCED: "success",
  PAYMENT_PENDING: "warning",
  PAYMENT_VERIFIED: "success",
  READY_FOR_DELIVERY: "primary",
  OUT_FOR_DELIVERY: "primary",
  COMPLETED: "primary",
  CANCELLED: "danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={map[status] || "neutral"}>{status}</Badge>;
}
