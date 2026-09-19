import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Loader2 } from "lucide-react";

// AI assistant embedded in each problem card. "Explicar" describes the problem;
// "Sugerir resolução" proposes steps and prefills the resolution field via onSuggest.
export default function AiAssistant({ problem, onSuggest, onResolved }) {
  const [mode, setMode] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resolving, setResolving] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const resolveWithAi = async () => {
    setResolving(true);
    setErr("");
    setOutcome(null);
    try {
      const res = await base44.functions.invoke("aiResolve", {
        type: problem.type,
        entityId: problem.entityId,
      });
      setOutcome(res?.data || null);
      const applied = res?.data?.applied;
      if (applied && applied !== "none" && applied !== "needs_human") onResolved?.();
    } catch (e) {
      setErr(e?.message || "A IA não conseguiu resolver.");
    } finally {
      setResolving(false);
    }
  };

  const run = async (m) => {
    setLoading(true);
    setErr("");
    setMode(m);
    setText("");
    try {
      const res = await base44.functions.invoke("aiAssist", {
        mode: m,
        problem: {
          type: problem.type,
          title: problem.title,
          saas: problem.saas,
          severity: problem.severity,
          status: problem.statusLabel,
          summary: problem.summary,
          guide: problem.guide,
        },
      });
      const out = res?.data?.text || "";
      setText(out);
      if (m === "suggest" && onSuggest) onSuggest(out);
    } catch (e) {
      setErr(e?.message || "A IA não respondeu. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-violet-700">
        <Sparkles className="h-3.5 w-3.5" /> Assistente IA
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-100"
          disabled={loading}
          onClick={() => run("explain")}
        >
          {loading && mode === "explain" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Explicar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-100"
          disabled={loading}
          onClick={() => run("suggest")}
        >
          {loading && mode === "suggest" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          Sugerir resolução
        </Button>
        <Button
          size="sm"
          className="h-7 gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
          disabled={resolving || loading}
          onClick={resolveWithAi}
        >
          {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Resolver com IA
        </Button>
      </div>
      {loading && !text && <p className="text-xs text-violet-600">Pensando…</p>}
      {resolving && <p className="text-xs text-violet-600">Resolvendo…</p>}
      {err && <p className="text-xs text-rose-600">{err}</p>}
      {text && <p className="whitespace-pre-wrap text-sm text-slate-700">{text}</p>}
      {outcome && (
        <div className="rounded-md border border-violet-200 bg-white p-2 text-xs">
          <p className="font-medium text-violet-700">IA aplicou: {outcome.applied || outcome.decision}</p>
          {outcome.summary && <p className="mt-0.5 text-slate-600">{outcome.summary}</p>}
          {outcome.note && <p className="mt-0.5 text-amber-600">{outcome.note}</p>}
        </div>
      )}
    </div>
  );
}