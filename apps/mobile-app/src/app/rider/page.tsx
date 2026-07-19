"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@rabtaone/api-client";
import type { DeliveryDraft } from "@rabtaone/types";
import { Card, CardBody, CardHeader, Button, Skeleton } from "@rabtaone/ui";
import { useRole } from "@/lib/role-context";

export default function RiderHomePage() {
  const { activeRole } = useRole();
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [assignedCount, setAssignedCount] = useState<number | null>(null);
  const [deliveredCount, setDeliveredCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeRole !== "DELIVERY") return;
    let mounted = true;
    async function load() {
      try {
        const [open, assigned, history] = await Promise.all([
          apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts"),
          apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts?scope=assigned"),
          apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts?scope=history"),
        ]);
        if (!mounted) return;
        setOpenCount(open.length);
        setAssignedCount(assigned.length);
        setDeliveredCount(history.length);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeRole]);

  if (activeRole !== "DELIVERY") {
    return <div className="p-5 text-sm text-slate-500">Switch to Rider Mode to access.</div>;
  }

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Rider Dashboard" subtitle="Your delivery activity" />
        <CardBody>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 py-3">
                <p className="text-2xl font-semibold text-slate-800">{openCount}</p>
                <p className="text-xs text-slate-500 mt-1">Open</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-3">
                <p className="text-2xl font-semibold text-slate-800">{assignedCount}</p>
                <p className="text-xs text-slate-500 mt-1">Active</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-3">
                <p className="text-2xl font-semibold text-slate-800">{deliveredCount}</p>
                <p className="text-xs text-slate-500 mt-1">Delivered</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <Link href="/rider/jobs">
              <Button>View Jobs</Button>
            </Link>
            <Link href="/rider/history">
              <Button variant="secondary">History</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
