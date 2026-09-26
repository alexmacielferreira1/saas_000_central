import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { updateSaas } from "@/api/saasRegistry";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPATIBILITY, HEALTH, SAAS_STATUS } from "@/lib/adminHelpers";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  version: "",
  base_url: "",
  color: "#6366f1",
  icon: "Boxes",
  status: "unavailable",
  health: "unknown",
  compatibility: "limited",
  integration_level: "inventory",
};

function optionsWithCurrent(options, current) {
  return options.includes(current) || !current ? options : [current, ...options];
}

export default function EditSaasDialog({ open, product, onOpenChange, onUpdated }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && product) {
      setForm({
        name: product.name ?? emptyForm.name,
        slug: product.slug ?? emptyForm.slug,
        description: product.description ?? emptyForm.description,
        version: product.version ?? emptyForm.version,
        base_url: product.base_url ?? emptyForm.base_url,
        color: product.color ?? emptyForm.color,
        icon: product.icon ?? emptyForm.icon,
        status: product.status ?? emptyForm.status,
        health: product.health ?? emptyForm.health,
        compatibility: product.compatibility ?? emptyForm.compatibility,
        integration_level: product.integration_level ?? emptyForm.integration_level,
      });
      setError("");
    }
  }, [open, product]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateSaas(product.id, {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        version: form.version.trim(),
        base_url: form.base_url.trim(),
        icon: form.icon.trim(),
      });
      onUpdated?.(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const statuses = optionsWithCurrent(Object.keys(SAAS_STATUS), form.status);
  const healths = optionsWithCurrent(Object.keys(HEALTH), form.health);
  const compatibilities = optionsWithCurrent(Object.keys(COMPATIBILITY), form.compatibility);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar SaaS</DialogTitle>
          <DialogDescription>Atualize os dados do produto no inventário da Central.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-saas-name">Nome *</Label>
              <Input id="edit-saas-name" value={form.name} onChange={(event) => set("name", event.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-slug">Slug</Label>
              <Input id="edit-saas-slug" value={form.slug} onChange={(event) => set("slug", event.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-version">Versão</Label>
              <Input id="edit-saas-version" value={form.version} onChange={(event) => set("version", event.target.value)} disabled={saving} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-saas-url">Base URL</Label>
              <Input id="edit-saas-url" value={form.base_url} onChange={(event) => set("base_url", event.target.value)} disabled={saving} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-saas-description">Descrição</Label>
              <textarea id="edit-saas-description" value={form.description} onChange={(event) => set("description", event.target.value)} rows={2} disabled={saving} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-color">Cor (hex)</Label>
              <Input id="edit-saas-color" value={form.color} onChange={(event) => set("color", event.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-icon">Ícone (lucide)</Label>
              <Input id="edit-saas-icon" value={form.icon} onChange={(event) => set("icon", event.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-status">Status</Label>
              <select id="edit-saas-status" value={form.status} onChange={(event) => set("status", event.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {statuses.map((value) => <option key={value} value={value}>{SAAS_STATUS[value]?.label || value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-health">Health</Label>
              <select id="edit-saas-health" value={form.health} onChange={(event) => set("health", event.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {healths.map((value) => <option key={value} value={value}>{HEALTH[value]?.label || value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-compatibility">Compatibilidade</Label>
              <select id="edit-saas-compatibility" value={form.compatibility} onChange={(event) => set("compatibility", event.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {compatibilities.map((value) => <option key={value} value={value}>{COMPATIBILITY[value]?.label || value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-saas-level">Nível de integração</Label>
              <select id="edit-saas-level" value={form.integration_level} onChange={(event) => set("integration_level", event.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="inventory">Inventário</option>
                <option value="read">Leitura</option>
                <option value="users_config">Users/Config</option>
                <option value="write_controlled">Escrita controlada</option>
                <option value="domain_resources">Recursos de domínio</option>
                <option value="automation">Automação</option>
              </select>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
