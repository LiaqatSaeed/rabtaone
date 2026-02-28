"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { decodeJwt } from "@/lib/api";
import type { JwtPayload } from "@/types";
import { Badge } from "@/components/ui/Badge";

const navItems = [
  { href: "/merchant", label: "Dashboard" },
  { href: "/merchant/orders", label: "Orders" },
  { href: "/merchant/sync", label: "Sync" },
  { href: "/merchant/settings", label: "Settings" },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<JwtPayload | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const decoded = decodeJwt(token) as JwtPayload | null;
    if (!decoded || !decoded.roles?.includes("MERCHANT")) {
      window.location.href = "/";
      return;
    }
    setPayload(decoded);
    setLoading(false);
  }, []);

  const merchantName = useMemo(() => {
    if (!payload) return "Merchant";
    return payload.name || `Merchant ${payload.sub.slice(0, 6)}`;
  }, [payload]);

  const industryType = useMemo(() => {
    if (typeof window === "undefined") return "GENERIC";
    const token = localStorage.getItem("jwt");
    const decoded = token ? (decodeJwt(token) as Record<string, any> | null) : null;
    return decoded?.industryType || "GENERIC";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 border-r border-slate-200 bg-slate-100/60 p-5 hidden lg:flex flex-col">
        <div className="text-lg font-semibold mb-8 text-slate-900">IdeaApp</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-slate-400">IdeaApp Merchant Console</div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-6 py-4 gap-3">
          <div>
            <div className="text-sm text-slate-500">Merchant Dashboard</div>
            <div className="text-base font-semibold text-slate-900">{merchantName}</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="primary">{industryType}</Badge>
            <button
              onClick={() => {
                localStorage.removeItem("jwt");
                window.location.href = "/login";
              }}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
