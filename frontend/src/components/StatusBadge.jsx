import React from "react";
import { toneClass, pick } from "@/lib/adminHelpers";
import { cn } from "@/lib/utils";

const DOT_CLASS = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export default function StatusBadge({ map, value, className }) {
  const { label, tone } = pick(map, value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass(tone),
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[tone] || DOT_CLASS.slate)} />
      {label}
    </span>
  );
}