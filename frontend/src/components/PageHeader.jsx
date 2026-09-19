import React from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, description = null, icon: Icon, actions = null, className = "" }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
