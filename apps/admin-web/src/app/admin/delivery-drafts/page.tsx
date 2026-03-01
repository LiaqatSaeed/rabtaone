"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@rabtaone/api-client";
import { Badge, Card, CardBody, CardHeader, Skeleton, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@rabtaone/ui";

type DraftRow = {
  id: string;
  status: string;
  createdAt: string;
  riderId?: string | null;
  order?: { id: string } | null;
  rider?: { fullName: string } | null;
};

const statuses = ["OPEN", "ASSIGNED", "PICKED", "DELIVERED", "CANCELLED"];

export default function AdminDeliveryDraftsPage() {
  const [items, setItems] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const query = status ? `?status=${status}` : "";
        const data = await apiFetch<DraftRow[]>(`/api/v1/admin/delivery-drafts${query}`);
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
          <h1 className="text-2xl font-semibold text-slate-900">Delivery Drafts</h1>
          <p className="text-sm text-slate-600">Rider workflow snapshot.</p>
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
        <CardHeader title="Recent Drafts" subtitle="Latest delivery drafts" />
        <CardBody>
          {loading ? (
            <Skeleton className="h-64" />
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">No drafts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Draft ID</TableHeaderCell>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Rider</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id.slice(0, 10)}...</TableCell>
                      <TableCell>{item.order?.id?.slice(0, 8) || "-"}</TableCell>
                      <TableCell>{item.rider?.fullName || item.riderId?.slice(0, 6) || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "DELIVERED" ? "success" : item.status === "OPEN" ? "warning" : "neutral"}>
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
