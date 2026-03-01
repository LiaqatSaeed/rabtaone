"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@rabtaone/api-client";
import type { Proposal } from "@rabtaone/types";
import { Card, CardBody, CardHeader, Button, Skeleton } from "@rabtaone/ui";

export default function ProposalsPage() {
  const { orderId } = useParams();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<Proposal[]>(`/api/v1/orders/${orderId}/proposals`);
        if (!mounted) return;
        setProposals(data || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (orderId) load();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const acceptProposal = async (proposalId: string) => {
    setMessage(null);
    setBusyId(proposalId);
    try {
      await apiFetch(`/api/v1/orders/${orderId}/accept-proposal`, {
        method: "POST",
        body: JSON.stringify({ proposalId }),
      });
      setMessage("Proposal accepted. Awaiting sync.");
      const updated = await apiFetch<Proposal[]>(`/api/v1/orders/${orderId}/proposals`);
      setProposals(updated || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to accept proposal");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-5">
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Merchant Proposals" subtitle="Compare offers and accept one" />
        <CardBody>
          {message && <p className="text-sm text-emerald-600 mb-3">{message}</p>}
          {proposals.length === 0 ? (
            <p className="text-sm text-slate-500">No proposals yet.</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Merchant {p.merchantId.slice(0, 6)}</p>
                      <p className="text-xs text-slate-500">Delivery: {p.deliveryOption}</p>
                      {p.status && <p className="text-xs text-slate-500">Status: {p.status}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${(p.priceCents / 100).toFixed(2)}</p>
                      <Button
                        className="mt-2"
                        onClick={() => acceptProposal(p.id)}
                        disabled={busyId === p.id || p.status === "ACCEPTED" || p.status === "REJECTED"}
                      >
                        {busyId === p.id ? "Accepting..." : "Accept"}
                      </Button>
                    </div>
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
