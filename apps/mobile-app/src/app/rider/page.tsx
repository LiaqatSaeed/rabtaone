"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader, Button } from "@rabtaone/ui";
import { useRole } from "@/lib/role-context";

export default function RiderHomePage() {
  const { activeRole } = useRole();

  if (activeRole !== "DELIVERY") {
    return <div className="p-5 text-sm text-slate-500">Switch to Rider Mode to access.</div>;
  }

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Rider Dashboard" subtitle="Delivery mode placeholder" />
        <CardBody>
          <p className="text-sm text-slate-600">Delivery features will appear here.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/rider/jobs">
              <Button>View Jobs</Button>
            </Link>
            <Link href="/rider/history">
              <Button variant="secondary">History</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
