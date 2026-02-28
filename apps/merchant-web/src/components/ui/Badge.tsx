import { ReactNode } from "react";

const variants: Record<string, string> = {
  primary: "bg-indigo-50 text-indigo-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  neutral: "bg-slate-100 text-slate-700",
};

export function Badge({ children, variant = "neutral" }: { children: ReactNode; variant?: keyof typeof variants }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
