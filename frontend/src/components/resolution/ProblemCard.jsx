import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, TerminalSquare, Boxes, Settings2, Lightbulb } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import {
  INCIDENT_STATUS,
  OP_STATUS,
  HEALTH,
  fmtDate,
  toneClass,
} from "@/lib/adminHelpers";
import { PROBLEM_TYPE, SEVERITY_LABEL } from "@/lib/problems";
import ResolutionActions from "@/components/resolution/ResolutionActions";
import AiAssistant from "@/components/resolution/AiAssistant";
import { cn } from "@/lib/utils";

const TYPE_ICON = { incident: AlertTriangle, command: TerminalSquare, saas: Boxes, config: Settings2 };
const SEV_TONE = { critical: "rose", high: "amber", medium: "sky", low: "slate" };
const STATUS_MAP = { incident: INCIDENT_STATUS, command: OP_STATUS, saas: HEALTH };

export default function ProblemCard({ problem, onMutated, navigate }) {
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const Icon = TYPE_ICON[problem.type] || AlertTriangle;
  const sevTone = SEV_TONE[problem.severity] || "slate";
  const statusMap = STATUS_MAP[problem.type];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
          open && "bg-slate-50"
        )}
      >
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClass(sevTone))}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{problem.title}</p>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", toneClass(sevTone))}>
              {SEVERITY_LABEL[problem.severity] || problem.severity}
            </span>
          </div>
          <p className="truncate text-xs text-slate-400">
            {PROBLEM_TYPE[problem.type].label} · {problem.saas} · {fmtDate(problem.createdAt)}
          </p>
        </div>
        <div className="hidden sm:block">
          {statusMap ? (
            <StatusBadge map={statusMap} value={problem.statusKey} />
          ) : (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", toneClass("amber"))}>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {problem.statusLabel}
            </span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Resumo</p>
                <p className="mt-1 text-sm text-slate-700">{problem.summary}</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Lightbulb className="h-3.5 w-3.5" /> Como resolver
                </p>
                <p className="mt-1 text-sm text-amber-800/90">{problem.guide}</p>
              </div>
              <AiAssistant problem={problem} onSuggest={(t) => setResolution(t)} onResolved={onMutated} />
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Ações rápidas</p>
                <ResolutionActions
                  problem={problem}
                  onMutated={onMutated}
                  navigate={navigate}
                  resolution={resolution}
                  setResolution={setResolution}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}