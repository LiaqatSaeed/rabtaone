"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";

const statusVariant: Record<string, "neutral" | "warning" | "success" | "danger" | "primary"> = {
  REQUESTED: "neutral",
  PROPOSED: "neutral",
  ACCEPTED: "warning",
  SYNC_PENDING: "warning",
  SYNCED: "success",
  PAYMENT_PENDING: "warning",
  PAYMENT_VERIFIED: "success",
  READY_FOR_DELIVERY: "primary",
  COMPLETED: "primary",
  OUT_FOR_DELIVERY: "primary",
  CANCELLED: "danger",
};

function formatAmount(order: Order) {
  if (!order.items?.length) return "-";
  const total = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"RABTAONE" | "OWN">("RABTAONE");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Order>(`/api/v1/orders/${orderId}`);
        if (!mounted) return;
        setOrder(data);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (orderId) load();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !order) {
    return <div className="text-sm text-rose-600">{error || "Order not found"}</div>;
  }

  const total = formatAmount(order);

  const refresh = async () => {
    const data = await apiFetch<Order>(`/api/v1/orders/${orderId}`);
    setOrder(data);
  };

  const verifyPayment = async () => {
    setActionId(orderId);
    try {
      await apiFetch(`/api/v1/orders/${orderId}/payment/verify`, { method: "POST" });
      await refresh();
    } finally {
      setActionId(null);
    }
  };

  const markReady = async () => {
    setActionId(orderId);
    try {
      await apiFetch(`/api/v1/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "READY_FOR_DELIVERY", deliveryMode }),
      });
      await refresh();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Order Details</h1>
          <p className="text-sm text-slate-600">Order ID {order.id}</p>
        </div>
        <Badge variant={statusVariant[order.status] || "neutral"}>{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Items" subtitle="Line items for this order" />
            <CardBody>
              {order.items?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>SKU</TableHeaderCell>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Qty</TableHeaderCell>
                        <TableHeaderCell>Unit Price</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <tbody>
                      {order.items.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                              item.unitPrice
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No items recorded.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer" subtitle="Shipping details" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <p className="text-xs text-slate-400">Name</p>
                  <p>{order.shipName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p>{order.shipPhone || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-400">Address</p>
                  <p>
                    {[
                      order.shipAddress1,
                      order.shipAddress2,
                      order.shipCity,
                      order.shipState,
                      order.shipPostalCode,
                      order.shipCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Summary" />
            <CardBody>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sync Status</span>
                  <Badge
                    variant={
                      ["SYNCED", "PAYMENT_PENDING", "PAYMENT_VERIFIED", "READY_FOR_DELIVERY", "COMPLETED"].includes(
                        order.status
                      )
                        ? "success"
                        : "warning"
                    }
                  >
                    {["SYNCED", "PAYMENT_PENDING", "PAYMENT_VERIFIED", "READY_FOR_DELIVERY", "COMPLETED"].includes(
                      order.status
                    )
                      ? "SYNCED"
                      : "PENDING"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment</span>
                  <Badge variant={order.status === "PAYMENT_PENDING" ? "warning" : "success"}>
                    {order.status === "PAYMENT_PENDING"
                      ? "PENDING"
                      : order.status === "PAYMENT_VERIFIED"
                        ? "VERIFIED"
                        : "-"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Draft</span>
                  <Badge variant={order.deliveryDraft ? "primary" : "neutral"}>
                    {order.deliveryDraft?.status || "-"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {order.status === "PAYMENT_PENDING" && (
                  <Button onClick={verifyPayment} disabled={actionId === orderId}>
                    {actionId === orderId ? "Verifying..." : "Verify Payment"}
                  </Button>
                )}
                {order.status === "PAYMENT_VERIFIED" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={deliveryMode === "RABTAONE"}
                          onChange={() => setDeliveryMode("RABTAONE")}
                        />
                        Request RabtaOne Rider
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={deliveryMode === "OWN"}
                          onChange={() => setDeliveryMode("OWN")}
                        />
                        Own Delivery
                      </label>
                    </div>
                    <Button onClick={markReady} disabled={actionId === orderId}>
                      {actionId === orderId ? "Updating..." : "Mark Ready For Delivery"}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Retry Sync placeholder: add when FAILED status is supported */}
        </div>
      </div>
    </div>
  );
}
