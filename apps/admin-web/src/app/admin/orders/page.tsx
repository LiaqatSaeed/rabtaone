"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@rabtaone/api-client";
import { Badge, Card, CardBody, CardHeader, Skeleton, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@rabtaone/ui";

type OrderRow = {
  id: string;
  status: string;
  createdAt: string;
  merchant?: { name: string } | null;
  user?: { fullName: string } | null;
};

const statuses = [
  "REQUESTED",
  "ACCEPTED",
  "SYNCED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const query = status ? `?status=${status}` : "";
        const data = await apiFetch<OrderRow[]>(`/api/v1/admin/orders${query}`);
        if (!mounted) return;
        setOrders(data || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600">System-wide order snapshot.</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader title="Recent Orders" subtitle="Latest orders across the platform" />
        <CardBody>
          {loading ? (
            <Skeleton className="h-64" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Order ID</TableHeaderCell>
                    <TableHeaderCell>User</TableHeaderCell>
                    <TableHeaderCell>Merchant</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 10)}...</TableCell>
                      <TableCell>{order.user?.fullName || "-"}</TableCell>
                      <TableCell>{order.merchant?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "CANCELLED" ? "danger" : "neutral"}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
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
