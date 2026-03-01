"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@rabtaone/api-client";
import { Card, CardBody, CardHeader, Skeleton, StatCard, IconChart, IconOrders, IconSync } from "@rabtaone/ui";

type Overview = {
  ordersToday: number;
  pendingPayment: number;
  syncPending: number;
  syncFailed: number;
  draftsOpen: number;
  draftsAssigned: number;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<Overview>("/api/v1/admin/overview");
        if (!mounted) return;
        setData(res);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load overview");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

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

  if (error || !data) {
    return <div className="text-sm text-rose-600">{error || "No data"}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Overview</h1>
        <p className="text-sm text-slate-600">System-wide operational metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Orders Today" value={data.ordersToday} icon={<IconOrders />} />
        <StatCard title="Pending Payment" value={data.pendingPayment} icon={<IconChart />} />
        <StatCard title="Sync Pending" value={data.syncPending} icon={<IconSync />} />
        <StatCard title="Sync Failed" value={data.syncFailed} icon={<IconSync />} />
      </div>

      <Card>
        <CardHeader title="Delivery Drafts" subtitle="Open and assigned drafts" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Open Drafts" value={data.draftsOpen} icon={<IconOrders />} />
            <StatCard title="Assigned Drafts" value={data.draftsAssigned} icon={<IconOrders />} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
