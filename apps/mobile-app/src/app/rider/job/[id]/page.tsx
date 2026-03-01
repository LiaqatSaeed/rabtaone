"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@rabtaone/api-client";
import type { DeliveryDraft } from "@rabtaone/types";
import { Badge, Button, Card, CardBody, CardHeader, Skeleton } from "@rabtaone/ui";

export default function RiderJobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<DeliveryDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDraft = async () => {
    try {
      setLoading(true);
      setError(null);
      const assigned = await apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts?scope=assigned");
      const match = assigned.find((item) => item.id === params.id) || null;
      setDraft(match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, [params.id]);

  const handleUpdateStatus = async (status: "PICKED" | "DELIVERED") => {
    if (!draft) return;
    try {
      setBusy(true);
      await apiFetch(`/api/v1/rider/drafts/${draft.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Job Details" subtitle="Track and update your delivery" />
        <CardBody>
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}
          {!loading && error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && !error && !draft && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Job not found or not assigned.</p>
              <Button variant="secondary" onClick={() => router.push("/rider/jobs")}>Back to Jobs</Button>
            </div>
          )}
          {!loading && !error && draft && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-400">Order</p>
                  <p className="text-sm font-semibold text-slate-800">#{draft.orderId.slice(-6)}</p>
                </div>
                <Badge variant={draft.status === "ASSIGNED" ? "warning" : "success"}>{draft.status}</Badge>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase text-slate-400">Customer</p>
                <p className="text-sm font-medium text-slate-800">
                  {draft.order?.shipName || "Customer"}
                </p>
                <p className="text-xs text-slate-500">{draft.order?.shipPhone || "No phone provided"}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 space-y-2">
                <div>
                  <p className="text-xs uppercase text-slate-400">Pickup</p>
                  <p className="text-sm text-slate-600">Merchant location</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Dropoff</p>
                  <p className="text-sm text-slate-600">
                    {[
                      draft.order?.shipAddress1,
                      draft.order?.shipAddress2,
                      draft.order?.shipCity,
                      draft.order?.shipState,
                      draft.order?.shipPostalCode,
                      draft.order?.shipCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address provided"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {draft.status === "ASSIGNED" && (
                  <Button onClick={() => handleUpdateStatus("PICKED")} disabled={busy}>
                    {busy ? "Updating..." : "Mark Picked"}
                  </Button>
                )}
                {draft.status === "PICKED" && (
                  <Button onClick={() => handleUpdateStatus("DELIVERED")} disabled={busy}>
                    {busy ? "Updating..." : "Mark Delivered"}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => router.push("/rider/jobs")}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
