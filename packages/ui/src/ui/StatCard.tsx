import { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}
