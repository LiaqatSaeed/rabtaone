"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@rabtaone/api-client";
import { Card, CardBody, CardHeader, Button } from "@rabtaone/ui";

export default function NewOrderPage() {
  return (
    <Suspense fallback={null}>
      <NewOrderForm />
    </Suspense>
  );
}

function NewOrderForm() {
  const searchParams = useSearchParams();
  const industry = searchParams.get("industry") || "PHARMACY";
  const merchantSlug = searchParams.get("merchantSlug") || undefined;
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitOrder = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        prescriptionUrl: image ? URL.createObjectURL(image) : "https://example.com/placeholder.png",
        notes: description,
        merchantSlug,
      };
      await apiFetch("/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Order posted successfully.");
      setDescription("");
      setImage(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to submit order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Post New Order</h1>
        <p className="text-sm text-slate-600">Industry: {industry}</p>
        {merchantSlug && <p className="text-sm text-indigo-600 mt-1">Ordering from: {merchantSlug}</p>}
      </header>

      <Card>
        <CardHeader title="Order Details" />
        <CardBody>
          <div className="space-y-4">
            <textarea
              className="w-full rounded-lg border border-slate-200 p-3 text-sm"
              rows={5}
              placeholder="Describe what you need..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <label className="text-sm font-medium text-slate-700">Optional image</label>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </div>

            {message && <p className="text-sm text-slate-600">{message}</p>}

            <Button onClick={submitOrder} disabled={loading}>
              {loading ? "Submitting..." : "Submit Order"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
