"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@rabtaone/api-client";
import type { Order } from "@rabtaone/types";
import { Badge, Card, CardBody, CardHeader, Button, Skeleton } from "@rabtaone/ui";

const steps = [
  "REQUESTED",
  "ACCEPTED",
  "SYNCED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "READY_FOR_DELIVERY",
  "COMPLETED",
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<Order>(`/api/v1/orders/${id}`);
        if (!mounted) return;
        setOrder(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-5">
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-5 text-sm text-slate-600">Order not found.</div>;
  }

  const acceptedProposal = order.proposals?.find((p) => p.status === "ACCEPTED");

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Order Status" />
        <CardBody>
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{step}</span>
                <Badge variant={order.status === step ? "primary" : "neutral"}>
                  {order.status === step ? "Current" : ""}
                </Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {(order.merchant || acceptedProposal) && (
        <Card>
          <CardHeader title="Merchant" subtitle="Accepted proposal" />
          <CardBody>
            <div className="space-y-2 text-sm">
              {order.merchant && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Merchant</span>
                  <span className="font-medium text-slate-800">{order.merchant.name}</span>
                </div>
              )}
              {acceptedProposal && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Price</span>
                    <span className="font-medium text-slate-800">
                      {(acceptedProposal.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Delivery</span>
                    <span className="font-medium text-slate-800">{acceptedProposal.deliveryOption}</span>
                  </div>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Payment" subtitle="Upload payment screenshot" />
        <CardBody>
          {order.status === "PAYMENT_PENDING" && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Payment submitted. The merchant will verify it shortly — no further action needed.
            </p>
          )}
          {message && <p className="text-sm text-emerald-600 mb-2">{message}</p>}
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button
            className="mt-3"
            disabled={submitting || order.status !== "SYNCED"}
            onClick={async () => {
              if (!order) return;
              try {
                setSubmitting(true);
                const note = file ? `Payment screenshot: ${file.name}` : "Payment submitted";
                await apiFetch(`/api/v1/orders/${order.id}/payment/submit`, {
                  method: "POST",
                  body: JSON.stringify({ message: note }),
                });
                setMessage("Payment submitted. Awaiting verification.");
                const updated = await apiFetch<Order>(`/api/v1/orders/${order.id}`);
                setOrder(updated);
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Failed to submit payment");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Submitting..." : "Submit Payment"}
          </Button>
          {order.status !== "SYNCED" && (
            <p className="mt-2 text-xs text-slate-500">Payment becomes available after sync is complete.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
