import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return <table className="min-w-full text-sm">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-400">{children}</thead>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-slate-100 hover:bg-slate-50 transition">{children}</tr>;
}

export function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 ${className}`}>{children}</td>;
}

export function TableHeaderCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}
