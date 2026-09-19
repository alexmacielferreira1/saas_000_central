import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { writeAudit } from "@/lib/audit";
import { useOrgId } from "@/lib/TenantContext";

export default function NewConfigurationDialog({ open, onOpenChange, onCreated }) {
  const orgId = useOrgId();
  const [saasList, setSaasList] = useState([]);
  const [form, setForm] = useState({ saas_id: "central", key: "", value: "", environment: "production", type: "setting", enabled: true, author: "", reason: "", approval_status: "auto" });
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
    if (!form.key.trim()) { setError("Chave é obrigatória."); return; }
    setSaving(true); setError("");
    try {
      const created = await base44.entities.Configuration.create({
        organization_id: orgId,
        saas_id: form.saas_id,
        key: form.key.trim(),
        value: form.value,
        environment: form.environment,
        type: form.type,
        enabled: form.enabled,
        author: form.author.trim(),
        reason: form.reason.trim(),
        approval_status: form.approval_status,
      });
      writeAudit({ action: "config.create", saas: created.saas_id, entity: "Configuration", entityId: created.id, after: JSON.stringify({ key: created.key, value: created.value, type: created.type, enabled: created.enabled }), reason: created.reason || "Criação via Control Plane" });
      onCreated?.();
      onOpenChange(false);
      setForm({ saas_id: "central", key: "", value: "", environment: "production", type: "setting", enabled: true, author: "", reason: "", approval_status: "auto" });
    } catch (err) {
      setError(err?.message || "Não foi possível criar a configuração.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova configuração</DialogTitle>
          <DialogDescription>Crie uma configuração ou feature flag para a Central ou para um SaaS remoto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-saas">SaaS</Label>
              <select id="cfg-saas" value={form.saas_id} onChange={(e) => set("saas_id", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="central">Central</option>
                {saasList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-key">Chave *</Label>
              <Input id="cfg-key" value={form.key} onChange={(e) => set("key", e.target.value)} placeholder="ex.: max_tenants_per_plan" disabled={saving} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cfg-value">Valor</Label>
              <Input id="cfg-value" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="true / 50 / https://..." disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-env">Ambiente</Label>
              <select id="cfg-env" value={form.environment} onChange={(e) => set("environment", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="production">Produção</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-type">Tipo</Label>
              <select id="cfg-type" value={form.type} onChange={(e) => set("type", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="setting">Configuração</option>
                <option value="feature_flag">Feature flag</option>
                <option value="limit">Limite</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-author">Autor</Label>
              <Input id="cfg-author" value={form.author} onChange={(e) => set("author", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-approval">Aprovação</Label>
              <select id="cfg-approval" value={form.approval_status} onChange={(e) => set("approval_status", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="auto">Automática</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovada</option>
                <option value="rejected">Rejeitada</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cfg-reason">Motivo</Label>
              <Input id="cfg-reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} disabled={saving} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} disabled={saving} className="h-4 w-4 rounded border-slate-300" />
              Ativa
            </label>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Criar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}