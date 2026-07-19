"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@rabtaone/api-client";
import type { DeliveryDraft } from "@rabtaone/types";
import { Badge, Card, CardBody, CardHeader, Skeleton } from "@rabtaone/ui";

export default function RiderHistoryPage() {
  const [drafts, setDrafts] = useState<DeliveryDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await apiFetch<DeliveryDraft[]>("/api/v1/rider/drafts?scope=history");
        if (!mounted) return;
        setDrafts(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-5">
      <Card>
        <CardHeader title="History" subtitle="Deliveries you've completed" />
        <CardBody>
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {!loading && error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && !error && drafts.length === 0 && (
            <p className="text-sm text-slate-500">No completed deliveries yet.</p>
          )}
          {!loading && !error && drafts.length > 0 && (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Order #{draft.orderId.slice(-6)}</p>
                    <p className="text-xs text-slate-500">
                      Delivered {new Date(draft.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="success">{draft.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
