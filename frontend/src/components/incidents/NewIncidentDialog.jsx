import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { INCIDENT_SEVERITY } from "@/lib/adminHelpers";
import { writeAudit } from "@/lib/audit";
import { useOrgId } from "@/lib/TenantContext";

const SEVERITIES = Object.keys(INCIDENT_SEVERITY);

export default function NewIncidentDialog({ open, onOpenChange, onCreated }) {
  const orgId = useOrgId();
  const [saasList, setSaasList] = useState([]);
  const [form, setForm] = useState({ title: "", saas: "", severity: "medium", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try { const data = await base44.entities.Saas.list(); setSaasList(data || []); } catch {}
    })();
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Título é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      const created = await base44.entities.Incident.create({
        organization_id: orgId,
        title: form.title.trim(),
        saas: form.saas,
        severity: form.severity,
        description: form.description.trim(),
        status: "open",
        opened_at: new Date().toISOString(),
      });
      writeAudit({ action: "incident.open", saas: created.saas || "central", entity: "Incident", entityId: created.id, after: JSON.stringify({ title: created.title, severity: created.severity, status: created.status }), reason: "Abertura via Control Plane" });
      onCreated?.();
      onOpenChange(false);
      setForm({ title: "", saas: "", severity: "medium", description: "" });
    } catch (err) {
      setError(err?.message || "Não foi possível registrar o incidente.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar incidente</DialogTitle>
          <DialogDescription>Abre um incidente no ecossistema. A criação dispara automaticamente a tarefa no Linear.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inc-title">Título *</Label>
            <Input id="inc-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Latência elevada no checkout" disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inc-saas">SaaS</Label>
              <select id="inc-saas" value={form.saas} onChange={(e) => set("saas", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— não vinculado —</option>
                {saasList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inc-sev">Severidade</Label>
              <select id="inc-sev" value={form.severity} onChange={(e) => set("severity", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {SEVERITIES.map((s) => <option key={s} value={s}>{INCIDENT_SEVERITY[s].label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-desc">Descrição</Label>
            <textarea id="inc-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} disabled={saving} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}