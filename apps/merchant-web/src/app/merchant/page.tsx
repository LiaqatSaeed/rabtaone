"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Order, SyncRequest } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconChart, IconOrders, IconSync } from "@/components/ui/icons";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export default function MerchantOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingSync, setPendingSync] = useState<SyncRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ordersData, syncData] = await Promise.all([
          apiFetch<Order[]>("/api/v1/orders?limit=5"),
          apiFetch<SyncRequest[]>("/api/v1/sync/pending"),
        ]);
        if (!mounted) return;
        setOrders(ordersData || []);
        setPendingSync(syncData || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const isToday = (d: string) => {
      const date = new Date(d);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    };

    const totalOrdersToday = orders.filter((o) => isToday(o.createdAt)).length;
    const pendingOrders = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length;
    const syncedToday = orders.filter(
      (o) =>
        ["SYNCED", "PAYMENT_PENDING", "PAYMENT_VERIFIED", "READY_FOR_DELIVERY"].includes(o.status) && isToday(o.createdAt)
    ).length;

    return {
      totalOrdersToday,
      pendingOrders,
      pendingSync: pendingSync.length,
      syncedToday,
    };
  }, [orders, pendingSync]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-600">Quick snapshot of today&apos;s activity.</p>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Orders" value={formatNumber(stats.totalOrdersToday)} icon={<IconOrders />} />
            <StatCard title="Pending Orders" value={formatNumber(stats.pendingOrders)} icon={<IconChart />} />
            <StatCard title="Pending Sync" value={formatNumber(stats.pendingSync)} icon={<IconSync />} />
            <StatCard title="Synced Today" value={formatNumber(stats.syncedToday)} icon={<IconChart />} />
          </div>

          <Card>
            <CardHeader title="Recent Orders" subtitle="Last 5 orders created" />
            <CardBody>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No recent orders.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Order ID</TableHeaderCell>
                        <TableHeaderCell>Customer</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Created At</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <tbody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 10)}...</TableCell>
                          <TableCell>{order.shipName || "Customer"}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
