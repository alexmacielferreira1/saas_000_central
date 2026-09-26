import React, { useState } from "react";
import { createSaas } from "@/api/saasRegistry";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { SAAS_STATUS, HEALTH, COMPATIBILITY } from "@/lib/adminHelpers";

const STATUSES = Object.keys(SAAS_STATUS);
const HEALTHS = Object.keys(HEALTH);
const COMPATS = Object.keys(COMPATIBILITY);

export default function NewSaasDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ name: "", slug: "", description: "", version: "1.0.0", base_url: "", color: "#6366f1", icon: "Boxes", status: "unavailable", health: "unknown", compatibility: "limited", integration_level: "inventory" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      await createSaas({
        name: form.name.trim(),
        slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
        description: form.description.trim(),
        version: form.version.trim(),
        base_url: form.base_url.trim(),
        color: form.color,
        icon: form.icon.trim(),
        status: form.status,
        health: form.health,
        compatibility: form.compatibility,
        integration_level: form.integration_level,
      });
      onCreated?.();
      onOpenChange(false);
      setForm({ name: "", slug: "", description: "", version: "1.0.0", base_url: "", color: "#6366f1", icon: "Boxes", status: "unavailable", health: "unknown", compatibility: "limited", integration_level: "inventory" });
    } catch (err) {
      setError(err?.message || "Não foi possível registrar o SaaS.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar SaaS</DialogTitle>
          <DialogDescription>Adicione um produto ao inventário do Control Plane.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="saas-name">Nome *</Label>
              <Input id="saas-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: LojaFácil 360" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-slug">Slug</Label>
              <Input id="saas-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="lojafacil-360" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-version">Versão</Label>
              <Input id="saas-version" value={form.version} onChange={(e) => set("version", e.target.value)} disabled={saving} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="saas-url">Base URL</Label>
              <Input id="saas-url" value={form.base_url} onChange={(e) => set("base_url", e.target.value)} placeholder="https://app.lojafacil.com" disabled={saving} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="saas-desc">Descrição</Label>
              <textarea id="saas-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} disabled={saving} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-color">Cor (hex)</Label>
              <Input id="saas-color" value={form.color} onChange={(e) => set("color", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-icon">Ícone (lucide)</Label>
              <Input id="saas-icon" value={form.icon} onChange={(e) => set("icon", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-status">Status</Label>
              <select id="saas-status" value={form.status} onChange={(e) => set("status", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {STATUSES.map((s) => <option key={s} value={s}>{SAAS_STATUS[s].label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-health">Health</Label>
              <select id="saas-health" value={form.health} onChange={(e) => set("health", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {HEALTHS.map((h) => <option key={h} value={h}>{HEALTH[h].label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-compat">Compatibilidade</Label>
              <select id="saas-compat" value={form.compatibility} onChange={(e) => set("compatibility", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {COMPATS.map((c) => <option key={c} value={c}>{COMPATIBILITY[c].label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saas-level">Nível de integração</Label>
              <select id="saas-level" value={form.integration_level} onChange={(e) => set("integration_level", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="inventory">Inventário</option>
                <option value="read">Leitura</option>
                <option value="users_config">Users/Config</option>
                <option value="write_controlled">Escrita controlada</option>
                <option value="domain_resources">Recursos de domínio</option>
                <option value="automation">Automação</option>
              </select>
            </div>
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
