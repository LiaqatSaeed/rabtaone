"use client";

import { useRole } from "@/lib/role-context";
import { Card, CardBody, CardHeader, Button } from "@rabtaone/ui";
import { getUserFromToken } from "@/lib/auth";

export default function ProfilePage() {
  const user = getUserFromToken();
  const { roles, activeRole, setActiveRole } = useRole();

  if (!user) {
    return <div className="p-5 text-sm text-slate-600">Please login.</div>;
  }

  const hasDelivery = roles.includes("DELIVERY");

  return (
    <div className="p-5 space-y-5">
      <Card>
        <CardHeader title="Profile" />
        <CardBody>
          <div className="text-sm text-slate-700 space-y-2">
            <p>User ID: {user.sub}</p>
            <p>Roles: {roles.join(", ")}</p>
          </div>
        </CardBody>
      </Card>

      {hasDelivery && (
        <Card>
          <CardHeader title="Mode" subtitle="Switch between Buyer and Rider" />
          <CardBody>
            <div className="flex items-center gap-3">
              <Button
                variant={activeRole === "USER" ? "primary" : "secondary"}
                onClick={() => setActiveRole("USER")}
              >
                Buyer Mode
              </Button>
              <Button
                variant={activeRole === "DELIVERY" ? "primary" : "secondary"}
                onClick={() => setActiveRole("DELIVERY")}
              >
                Rider Mode
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
