"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SyncRequest } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconEmpty } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function SyncPage() {
  const [requests, setRequests] = useState<SyncRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SyncRequest[]>("/api/v1/sync/pending?status=all");
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendToErp(req: SyncRequest) {
    setBusyId(req.syncId);
    setError(null);
    try {
      await apiFetch("/api/v1/sync/order", {
        method: "POST",
        body: JSON.stringify({ orderId: req.order.id, status: req.status || "PENDING", data: req }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send to ERP");
    } finally {
      setBusyId(null);
    }
  }

  function startConfirm(req: SyncRequest) {
    setConfirmingId(req.syncId);
    setInvoiceNumber("");
    setTotalAmount(req.order.totalAmount ? String(req.order.totalAmount) : "");
  }

  async function submitConfirm(req: SyncRequest) {
    if (!invoiceNumber.trim() || !totalAmount.trim()) return;
    setBusyId(req.syncId);
    setError(null);
    try {
      await apiFetch(`/api/v1/sync/${req.syncId}/confirm`, {
        method: "POST",
        body: JSON.stringify({ invoiceNumber: invoiceNumber.trim(), totalAmount: Number(totalAmount) }),
      });
      setConfirmingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm sync");
    } finally {
      setBusyId(null);
    }
  }

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
        <p className="text-sm text-slate-600">ERP sync requests for your orders.</p>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      <Card>
        <CardHeader title="Sync Requests" subtitle="Pending and synced ERP requests" />
        <CardBody>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 py-10">
              <IconEmpty />
              <p className="text-sm mt-3">No sync requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Invoice</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell>Created At</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {requests.map((req) => (
                    <TableRow key={req.syncId}>
                      <TableCell className="font-mono text-xs">{req.order.id.slice(0, 10)}...</TableCell>
                      <TableCell>
                        <Badge variant={req.status === "SYNCED" ? "success" : "warning"}>
                          {req.status || "PENDING"}
                        </Badge>
                      </TableCell>
                      <TableCell>{req.invoiceNumber || "-"}</TableCell>
                      <TableCell>{req.totalAmount ?? req.order.totalAmount}</TableCell>
                      <TableCell>{formatDate(req.createdAt)}</TableCell>
                      <TableCell>
                        {req.status !== "SYNCED" && (
                          <div className="flex flex-col gap-2">
                            {confirmingId === req.syncId ? (
                              <div className="flex flex-col gap-2 w-48">
                                <input
                                  className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                                  placeholder="Invoice number"
                                  value={invoiceNumber}
                                  onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                                <input
                                  className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                                  placeholder="Total amount"
                                  type="number"
                                  value={totalAmount}
                                  onChange={(e) => setTotalAmount(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    className="text-xs"
                                    disabled={busyId === req.syncId}
                                    onClick={() => submitConfirm(req)}
                                  >
                                    {busyId === req.syncId ? "Confirming..." : "Confirm"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="text-xs"
                                    onClick={() => setConfirmingId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  className="text-xs"
                                  disabled={busyId === req.syncId}
                                  onClick={() => sendToErp(req)}
                                >
                                  {busyId === req.syncId ? "Sending..." : "Send to ERP"}
                                </Button>
                                <Button className="text-xs" onClick={() => startConfirm(req)}>
                                  Confirm Sync
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
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
