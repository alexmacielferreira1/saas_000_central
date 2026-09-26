import React, { useState } from "react";
import { createManager } from "@/api/access";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { MANAGER_ROLE } from "@/lib/adminHelpers";

const ROLES = Object.keys(MANAGER_ROLE);

export default function NewManagerDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ full_name: "", email: "", role: "viewer", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { setError("Nome e email são obrigatórios."); return; }
    setSaving(true); setError("");
    try {
      await createManager({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
      });
      onCreated?.();
      onOpenChange(false);
      setForm({ full_name: "", email: "", role: "viewer", password: "" });
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
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="mgr-password">Senha temporária *</Label>
              <Input id="mgr-password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} minLength={12} disabled={saving} />
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
