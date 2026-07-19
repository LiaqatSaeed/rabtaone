"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { activeRole, loaded } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loaded && activeRole !== "USER") {
      router.replace("/rider");
    }
  }, [activeRole, loaded, router]);

  return <>{children}</>;
}
