"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const { activeRole, loaded } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loaded && activeRole !== "DELIVERY") {
      router.replace("/user");
    }
  }, [activeRole, loaded, router]);

  return <>{children}</>;
}
