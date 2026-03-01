"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@rabtaone/api-client";
import type { DeliveryDraft } from "@rabtaone/types";
import { Badge, Button, Card, CardBody, CardHeader, Skeleton } from "@rabtaone/ui";

export default function RiderJobsPage() {
  const [openDrafts, setOpenDrafts] = useState<DeliveryDraft[]>([]);
  const [assignedDrafts, setAssignedDrafts] = useState<DeliveryDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [open, assigned] = await Promise.all([
        apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts"),
        apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts?scope=assigned"),
      ]);
      setOpenDrafts(open);
      setAssignedDrafts(assigned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      setBusyId(id);
      await apiFetch(`/api/v1/rider/drafts/${id}/accept`, { method: "POST" });
      await loadDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept draft");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Open Drafts" subtitle="Accept a job to start delivery" />
        <CardBody>
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {!loading && error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}
          {!loading && !error && openDrafts.length === 0 && (
            <p className="text-sm text-slate-500">No open drafts right now.</p>
          )}
          {!loading && !error && openDrafts.length > 0 && (
            <div className="space-y-3">
              {openDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Order #{draft.orderId.slice(-6)}</p>
                    <p className="text-xs text-slate-500">
                      Created {new Date(draft.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAccept(draft.id)}
                    disabled={busyId === draft.id}
                  >
                    {busyId === draft.id ? "Accepting..." : "Accept"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Assigned Jobs" subtitle="Jobs you accepted" />
        <CardBody>
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {!loading && !error && assignedDrafts.length === 0 && (
            <p className="text-sm text-slate-500">No assigned jobs yet.</p>
          )}
          {!loading && !error && assignedDrafts.length > 0 && (
            <div className="space-y-3">
              {assignedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Order #{draft.orderId.slice(-6)}</p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(draft.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={draft.status === "ASSIGNED" ? "warning" : "success"}>
                      {draft.status}
                    </Badge>
                    <Link href={`/rider/job/${draft.id}`}>
                      <Button variant="secondary">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
