"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@rabtaone/api-client";
import type { Order } from "@rabtaone/types";
import { Card, CardBody, CardHeader, Button, Skeleton } from "@rabtaone/ui";
import { StatusBadge } from "@/components/StatusBadge";

const industries = [
  { id: "PHARMACY", label: "Pharmacy" },
  { id: "GROCERY", label: "Grocery" },
  { id: "HARDWARE", label: "Hardware" },
  { id: "ELECTRONICS", label: "Electronics" },
];

export default function HomePage() {
  const [selectedIndustry, setSelectedIndustry] = useState("PHARMACY");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<Order[]>("/api/v1/orders?limit=5");
        if (!mounted) return;
        setOrders(data || []);
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
    <div className="p-5 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">RabtaOne</h1>
        <Link href="/user/profile" className="text-sm text-slate-500">
          Profile
        </Link>
      </header>

      <Card>
        <CardHeader title="Choose an industry" />
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                  selectedIndustry === industry.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {industry.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Recent Orders</h2>
        <Link href={`/user/new?industry=${selectedIndustry}`}>
          <Button>Post Order</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">No orders yet. Post your first order.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/user/${order.id}`}>
              <Card className="hover:shadow-card transition">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Order {order.id.slice(0, 8)}...</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
