"use client";

import { useEffect } from "react";
import { useRole } from "@/lib/role-context";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const { activeRole } = useRole();

  useEffect(() => {
    if (activeRole !== "DELIVERY") {
      window.location.href = "/user";
    }
  }, [activeRole]);

  return <>{children}</>;
}
