"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@rabtaone/api-client";
import type { Order } from "@rabtaone/types";
import { Badge, Card, CardBody, CardHeader, Button, Skeleton } from "@rabtaone/ui";

const steps = ["REQUESTED", "ACCEPTED", "SYNCED", "READY_FOR_DELIVERY", "COMPLETED"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

      <Card>
        <CardHeader title="Payment" subtitle="Upload payment screenshot" />
        <CardBody>
          <input type="file" accept="image/*" className="text-sm" />
          <Button className="mt-3">Upload Screenshot</Button>
        </CardBody>
      </Card>
    </div>
  );
}
