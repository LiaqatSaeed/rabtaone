"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/admin";
  }, []);

  return <div className="p-6 text-sm text-slate-500">Redirecting...</div>;
}
