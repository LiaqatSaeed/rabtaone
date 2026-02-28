"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SyncRequest } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconEmpty } from "@/components/ui/icons";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function SyncPage() {
  const [pending, setPending] = useState<SyncRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<SyncRequest[]>("/api/v1/sync/pending");
        if (!mounted) return;
        setPending(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load sync requests");
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
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sync</h1>
        <p className="text-sm text-slate-600">Pending ERP sync requests.</p>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      {!error && (
        <Card>
          <CardHeader title="Pending Sync" subtitle="Requests waiting for ERP confirmation" />
          <CardBody>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-500 py-10">
                <IconEmpty />
                <p className="text-sm mt-3">No pending sync requests.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Sync ID</TableHeaderCell>
                      <TableHeaderCell>Order ID</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Created At</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <tbody>
                    {pending.map((req) => (
                      <TableRow key={req.syncId}>
                        <TableCell className="font-mono text-xs">{req.syncId.slice(0, 10)}...</TableCell>
                        <TableCell className="font-mono text-xs">{req.order.id.slice(0, 10)}...</TableCell>
                        <TableCell>PENDING</TableCell>
                        <TableCell>{formatDate(req.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
