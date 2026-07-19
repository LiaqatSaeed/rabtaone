"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { getUserFromToken } from "@/lib/auth";

const userLinks = [
  { href: "/user", label: "Home" },
  { href: "/user/new", label: "New Order" },
  { href: "/user/profile", label: "Profile" },
];

const riderLinks = [
  { href: "/rider", label: "Home" },
  { href: "/rider/jobs", label: "Jobs" },
  { href: "/rider/history", label: "History" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { roles, activeRole, setActiveRole } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !getUserFromToken() || pathname === "/login") return null;

  const links = activeRole === "DELIVERY" ? riderLinks : userLinks;
  const hasDelivery = roles.includes("DELIVERY");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-[0_-1px_6px_rgba(0,0,0,0.05)]">
      {hasDelivery && (
        <div className="flex items-center justify-center gap-2 border-b border-slate-100 py-2">
          <button
            onClick={() => setActiveRole("USER")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeRole === "USER" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Buyer Mode
          </button>
          <button
            onClick={() => setActiveRole("DELIVERY")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeRole === "DELIVERY" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Rider Mode
          </button>
        </div>
      )}
      <div className="flex items-center justify-around py-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                active ? "text-indigo-600 bg-indigo-50" : "text-slate-500"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
