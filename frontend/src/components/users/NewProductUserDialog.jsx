import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { PRODUCT_USER_STATUS } from "@/lib/adminHelpers";
import { useOrgId } from "@/lib/TenantContext";
import { writeAudit } from "@/lib/audit";

const STATUSES = Object.keys(PRODUCT_USER_STATUS);

export default function NewProductUserDialog({ open, onOpenChange, onCreated }) {
  const orgId = useOrgId();
  const [saasList, setSaasList] = useState([]);
  const [form, setForm] = useState({ saas_id: "", email: "", full_name: "", role: "", tenant: "", status: "active" });
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
    if (!form.email.trim() || !form.saas_id) { setError("SaaS e email são obrigatórios."); return; }
    setSaving(true); setError("");
    try {
      const created = await base44.entities.ProductUser.create({
        organization_id: orgId,
        saas_id: form.saas_id,
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        role: form.role.trim(),
        tenant: form.tenant.trim(),
        status: form.status,
        provenance: "local_calculation",
        last_sync: new Date().toISOString(),
      });
      writeAudit({ action: "productuser.create", saas: created.saas_id, entity: "ProductUser", entityId: created.id, after: JSON.stringify({ email: created.email, role: created.role, status: created.status }), reason: "Cadastro via Busca Global / Topbar" });
      onCreated?.();
      onOpenChange(false);
      setForm({ saas_id: "", email: "", full_name: "", role: "", tenant: "", status: "active" });
    } catch (err) {
      setError(err?.message || "Não foi possível cadastrar o usuário.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo usuário SaaS</DialogTitle>
          <DialogDescription>Registra um usuário de produto vinculado a um SaaS da empresa ativa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pu-saas">SaaS *</Label>
              <select id="pu-saas" value={form.saas_id} onChange={(e) => set("saas_id", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— selecionar —</option>
                {saasList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pu-email">Email *</Label>
              <Input id="pu-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pu-name">Nome</Label>
              <Input id="pu-name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pu-role">Role no SaaS</Label>
              <Input id="pu-role" value={form.role} onChange={(e) => set("role", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pu-tenant">Tenant</Label>
              <Input id="pu-tenant" value={form.tenant} onChange={(e) => set("tenant", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pu-status">Status</Label>
              <select id="pu-status" value={form.status} onChange={(e) => set("status", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {STATUSES.map((s) => <option key={s} value={s}>{PRODUCT_USER_STATUS[s].label}</option>)}
              </select>
            </div>
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