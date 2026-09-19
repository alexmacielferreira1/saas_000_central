import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { MANAGER_ROLE } from "@/lib/adminHelpers";
import { useOrgId } from "@/lib/TenantContext";
import { writeAudit } from "@/lib/audit";

const ROLES = Object.keys(MANAGER_ROLE);

export default function NewManagerDialog({ open, onOpenChange, onCreated }) {
  const orgId = useOrgId();
  const [form, setForm] = useState({ full_name: "", email: "", role: "viewer", scope_saas: "*", status: "active", two_factor_enabled: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { setError("Nome e email são obrigatórios."); return; }
    setSaving(true); setError("");
    try {
      const created = await base44.entities.Manager.create({
        organization_id: orgId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        scope_saas: form.scope_saas.trim() || "*",
        status: form.status,
        two_factor_enabled: form.two_factor_enabled,
      });
      writeAudit({ action: "manager.create", saas: "central", entity: "Manager", entityId: created.id, after: JSON.stringify({ full_name: created.full_name, role: created.role, scope_saas: created.scope_saas }), reason: "Cadastro via Busca Global / Topbar" });
      onCreated?.();
      onOpenChange(false);
      setForm({ full_name: "", email: "", role: "viewer", scope_saas: "*", status: "active", two_factor_enabled: false });
    } catch (err) {
      setError(err?.message || "Não foi possível cadastrar o administrador.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo administrador</DialogTitle>
          <DialogDescription>Cadastra um gestor no Control Plane da empresa ativa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="mgr-name">Nome *</Label>
              <Input id="mgr-name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} disabled={saving} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="mgr-email">Email *</Label>
              <Input id="mgr-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgr-role">Role</Label>
              <select id="mgr-role" value={form.role} onChange={(e) => set("role", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {ROLES.map((r) => <option key={r} value={r}>{MANAGER_ROLE[r].label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgr-status">Status</Label>
              <select id="mgr-status" value={form.status} onChange={(e) => set("status", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="break_glass">Break glass</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="mgr-scope">Escopo SaaS</Label>
              <Input id="mgr-scope" value={form.scope_saas} onChange={(e) => set("scope_saas", e.target.value)} placeholder="* ou ids separados por vírgula" disabled={saving} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.two_factor_enabled} onChange={(e) => set("two_factor_enabled", e.target.checked)} disabled={saving} className="h-4 w-4 rounded border-slate-300" />
              2FA habilitado
            </label>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}