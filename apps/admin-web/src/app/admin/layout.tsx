"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { decodeJwt } from "@rabtaone/api-client";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/delivery-drafts", label: "Delivery Drafts" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("Admin");

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const decoded = decodeJwt(token);
    if (!decoded?.roles?.includes("ADMIN")) {
      window.location.href = "/login";
      return;
    }
    if (decoded?.name) setName(decoded.name);
  }, []);

  const logout = () => {
    localStorage.removeItem("jwt");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 border-r border-slate-200 bg-white px-4 py-6">
          <div className="text-lg font-semibold text-slate-900">RabtaOne Admin</div>
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900">{name}</p>
            </div>
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={logout}
            >
              Logout
            </button>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
