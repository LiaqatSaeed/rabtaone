"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatAmount(order: Order) {
  if (!order.items?.length) return "-";
  const total = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
}

function syncStatus(order: Order) {
  if (
    order.status === "SYNCED" ||
    order.status === "PAYMENT_PENDING" ||
    order.status === "PAYMENT_VERIFIED" ||
    order.status === "READY_FOR_DELIVERY" ||
    order.status === "OUT_FOR_DELIVERY" ||
    order.status === "COMPLETED"
  ) {
    return "SYNCED";
  }
  if (["ACCEPTED", "SYNC_PENDING"].includes(order.status)) {
    return "PENDING";
  }
  return "-";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Order[]>("/api/v1/orders?merchant=true");
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: "READY_FOR_DELIVERY" | "CANCELLED") => {
    setActionMessage(null);
    try {
      setActionId(id);
      await apiFetch(`/api/v1/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setActionMessage(`Order ${status.replaceAll("_", " ").toLowerCase()} successfully.`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setActionId(null);
    }
  };

  const verifyPayment = async (id: string) => {
    setActionMessage(null);
    try {
      setActionId(id);
      await apiFetch(`/api/v1/orders/${id}/payment/verify`, { method: "POST" });
      setActionMessage("Payment verified.");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify payment");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-600">Manage and track merchant orders.</p>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
      {actionMessage && <div className="text-sm text-emerald-600">{actionMessage}</div>}

      <Card>
        <CardHeader title="All Orders" subtitle="Latest orders for your merchant account" />
        <CardBody>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Order ID</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell>Order Status</TableHeaderCell>
                    <TableHeaderCell>Sync Status</TableHeaderCell>
                    <TableHeaderCell>Created At</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/merchant/orders/${order.id}`} className="text-indigo-600 hover:underline">
                          {order.id.slice(0, 10)}...
                        </Link>
                      </TableCell>
                      <TableCell>{order.shipName || "Customer"}</TableCell>
                      <TableCell>{formatAmount(order)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] || "neutral"}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{syncStatus(order)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "PAYMENT_PENDING" && (
                            <Button
                              variant="secondary"
                              onClick={() => verifyPayment(order.id)}
                              disabled={actionId === order.id}
                            >
                              {actionId === order.id ? "Verifying..." : "Verify Payment"}
                            </Button>
                          )}
                          {order.status === "PAYMENT_VERIFIED" && (
                            <Button
                              variant="secondary"
                              onClick={() => updateStatus(order.id, "READY_FOR_DELIVERY")}
                              disabled={actionId === order.id}
                            >
                              {actionId === order.id ? "Updating..." : "Mark Ready"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => updateStatus(order.id, "CANCELLED")}
                            disabled={order.status === "CANCELLED" || actionId === order.id}
                          >
                            {actionId === order.id ? "Updating..." : "Reject"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
