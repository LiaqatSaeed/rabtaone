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
                  <Badge variant={order.status === "SYNCED" ? "success" : "warning"}>
                    {order.status === "SYNCED" ? "SYNCED" : "PENDING"}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Retry Sync placeholder: add when FAILED status is supported */}
        </div>
      </div>
    </div>
  );
}
