"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@rabtaone/api-client";
import { Badge, Card, CardBody, CardHeader, Skeleton, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@rabtaone/ui";

type SyncRow = {
  id: string;
  status: string;
  createdAt: string;
  order?: { id: string } | null;
  merchant?: { name: string } | null;
};

const statuses = ["PENDING", "SYNCED", "FAILED"];

export default function AdminSyncPage() {
  const [items, setItems] = useState<SyncRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const query = status ? `?status=${status}` : "";
        const data = await apiFetch<SyncRow[]>(`/api/v1/admin/sync${query}`);
        if (!mounted) return;
        setItems(data || []);
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
          <h1 className="text-2xl font-semibold text-slate-900">Sync Requests</h1>
          <p className="text-sm text-slate-600">ERP sync status across merchants.</p>
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
        <CardHeader title="Recent Sync Requests" subtitle="Latest sync entries" />
        <CardBody>
          {loading ? (
            <Skeleton className="h-64" />
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">No sync requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Sync ID</TableHeaderCell>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Merchant</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id.slice(0, 10)}...</TableCell>
                      <TableCell>{item.order?.id?.slice(0, 8) || "-"}</TableCell>
                      <TableCell>{item.merchant?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "FAILED" ? "danger" : item.status === "PENDING" ? "warning" : "success"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
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
