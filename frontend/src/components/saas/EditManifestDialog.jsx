import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { upsertCapabilityManifest } from "@/api/saasRegistry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const JSON_FIELDS = ["capabilities", "health", "resources", "scopes", "events", "limits"];
const LABELS = {
  capabilities: "Capabilities (JSON)",
  health: "Health (JSON)",
  resources: "Recursos (JSON)",
  scopes: "Scopes (JSON)",
  events: "Eventos (JSON)",
  limits: "Limites (JSON)",
};

const EMPTY = {
  version: "1.0.0",
  admin_api_version: "v1",
  compatibility: "limited",
  capabilities: "[]",
  health: "{}",
  resources: "[]",
  scopes: "[]",
  events: "[]",
  limits: "{}",
};

function formFromManifest(manifest) {
  if (!manifest) return EMPTY;
  const form = {
    ...EMPTY,
    version: manifest.version || EMPTY.version,
    admin_api_version: manifest.admin_api_version || EMPTY.admin_api_version,
    compatibility: manifest.compatibility || EMPTY.compatibility,
  };
  for (const field of JSON_FIELDS) {
    form[field] = JSON.stringify(manifest[field] ?? JSON.parse(EMPTY[field]), null, 2);
  }
  return form;
}

export default function EditManifestDialog({ open, productId, manifest, onOpenChange, onPublished }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(formFromManifest(manifest));
      setError("");
    }
  }, [open, manifest]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    let structured;
    try {
      structured = Object.fromEntries(JSON_FIELDS.map((field) => [field, JSON.parse(form[field])]));
      for (const field of ["capabilities", "resources", "scopes", "events"]) {
        if (!Array.isArray(structured[field])) throw new Error(`${LABELS[field]} deve ser uma lista.`);
      }
      for (const field of ["health", "limits"]) {
        if (!structured[field] || Array.isArray(structured[field]) || typeof structured[field] !== "object") {
          throw new Error(`${LABELS[field]} deve ser um objeto.`);
        }
      }
    } catch (err) {
      setError(err?.message?.includes("deve ser") ? err.message : "JSON inválido. Revise os campos estruturados.");
      return;
    }

    setSaving(true);
    try {
      const published = await upsertCapabilityManifest(productId, {
        version: form.version.trim(),
        admin_api_version: form.admin_api_version.trim() || null,
        compatibility: form.compatibility,
        ...structured,
      });
      onPublished?.(published);
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || "Não foi possível publicar o manifesto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{manifest ? "Editar" : "Publicar"} Capability Manifest</DialogTitle>
          <DialogDescription>
            Registre o contrato versionado usado pela Central para integrar este SaaS.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="manifest-version">Versão do manifesto *</Label>
              <Input id="manifest-version" value={form.version} onChange={(e) => set("version", e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manifest-api-version">Versão da Admin API</Label>
              <Input id="manifest-api-version" value={form.admin_api_version} onChange={(e) => set("admin_api_version", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manifest-compatibility">Compatibilidade</Label>
              <select id="manifest-compatibility" value={form.compatibility} onChange={(e) => set("compatibility", e.target.value)} disabled={saving} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="limited">Limitado</option>
                <option value="supported">Suportado</option>
                <option value="native">Nativo</option>
                <option value="incompatible">Incompatível</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {JSON_FIELDS.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={`manifest-${field}`}>{LABELS[field]}</Label>
                <textarea
                  id={`manifest-${field}`}
                  value={form[field]}
                  onChange={(e) => set(field, e.target.value)}
                  rows={5}
                  disabled={saving}
                  spellCheck={false}
                  className="w-full rounded-md border border-input bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar manifesto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
