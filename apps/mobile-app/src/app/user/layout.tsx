"use client";

import { useEffect } from "react";
import { useRole } from "@/lib/role-context";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { activeRole } = useRole();

  useEffect(() => {
    if (activeRole !== "USER") {
      window.location.href = "/rider";
    }
  }, [activeRole]);

  return <>{children}</>;
}
