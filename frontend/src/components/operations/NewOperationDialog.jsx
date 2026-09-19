import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSensitiveAction } from "@/lib/adminHelpers";
import { writeAudit } from "@/lib/audit";
import { useOrgId } from "@/lib/TenantContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Loader2 } from "lucide-react";

const SENSITIVE_NOTE = "Ações sensíveis (delete, suspend, reset, rotate...) entram como 'aguardando confirmação' e exigem aprovação manual antes de serem processadas.";

export default function NewOperationDialog({ open, onOpenChange, onCreated }) {
  const orgId = useOrgId();
  const [form, setForm] = useState({
    saas: "", tenant: "", resource: "", action: "", requested_by: "", dry_run: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sensitive = isSensitiveAction(form.action);

  const update = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.saas || !form.action) {
      setError("SaaS e ação são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const status = sensitive ? "awaiting_confirmation" : "queued";
      const created = await base44.entities.AdminCommand.create({
        organization_id: orgId,
        saas: form.saas,
        tenant: form.tenant,
        resource: form.resource,
        action: form.action,
        requested_by: form.requested_by,
        dry_run: form.dry_run,
        operation_id: `op-${Date.now()}`,
        status,
      });
      writeAudit({ action: "operation.create", saas: created.saas, tenant: created.tenant, entity: "AdminCommand", entityId: created.id, after: JSON.stringify({ action: created.action, resource: created.resource, status: created.status, dry_run: created.dry_run }), reason: created.requested_by ? `Solicitado por ${created.requested_by}` : "Criação via Control Plane" });
      onCreated?.(created);
      setForm({ saas: "", tenant: "", resource: "", action: "", requested_by: "", dry_run: false });
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Falha ao registrar operação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-indigo-600" /> Nova operação administrativa
          </DialogTitle>
          <DialogDescription>Registre um comando remoto. Operações sensíveis exigem confirmação manual.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="saas">SaaS *</Label>
              <Input id="saas" value={form.saas} onChange={update("saas")} placeholder="Ex: linear" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tenant">Tenant</Label>
              <Input id="tenant" value={form.tenant} onChange={update("tenant")} placeholder="Opcional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="resource">Recurso</Label>
              <Input id="resource" value={form.resource} onChange={update("resource")} placeholder="Ex: user:42" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="action">Ação *</Label>
              <Input id="action" value={form.action} onChange={update("action")} placeholder="Ex: suspend user" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="requested_by">Solicitante</Label>
            <Input id="requested_by" value={form.requested_by} onChange={update("requested_by")} placeholder="Quem está pedindo" />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.dry_run} onChange={update("dry_run")} className="h-4 w-4 rounded border-slate-300" />
            Dry run (simular sem aplicar)
          </label>

          {sensitive && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {SENSITIVE_NOTE}
            </div>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar operação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}