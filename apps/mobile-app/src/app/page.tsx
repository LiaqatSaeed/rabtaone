"use client";

import { useEffect } from "react";
import { useRole } from "@/lib/role-context";

export default function RootPage() {
  const { activeRole } = useRole();

  useEffect(() => {
    if (activeRole === "DELIVERY") {
      window.location.href = "/rider";
    } else {
      window.location.href = "/user";
    }
  }, [activeRole]);

  return <div className="p-5 text-sm text-slate-500">Loading...</div>;
}
