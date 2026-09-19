import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";

export function Card({ className = "", children = null, ...props }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className = "", children = null }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, description = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function ErrorState({ title = "Falha ao carregar", description = "Tente novamente em instantes.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
        <AlertCircle className="h-6 w-6 text-rose-500" />
      </div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function KpiCard({ label, value, sub = null, icon: Icon, tone = "indigo", onClick = undefined }) {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card
      className={cn("transition-shadow", onClick && "cursor-pointer hover:shadow-md")}
      onClick={onClick}
    >
      <CardBody className="flex items-center gap-4">
        {Icon && (
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="truncate text-sm text-slate-500">{label}</p>
          {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
