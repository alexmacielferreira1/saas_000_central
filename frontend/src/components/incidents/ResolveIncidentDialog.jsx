import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { writeAudit } from "@/lib/audit";

export default function ResolveIncidentDialog({ open, onOpenChange, incident, onResolved }) {
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await base44.entities.Incident.update(incident.id, {
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution: resolution.trim(),
      });
      writeAudit({ action: "incident.resolve", saas: incident.saas || "central", entity: "Incident", entityId: incident.id, before: JSON.stringify({ status: incident.status }), after: JSON.stringify({ status: "resolved", resolution: resolution.trim() }), reason: resolution.trim() || "Resolução via Control Plane" });
      onResolved?.();
      onOpenChange(false);
      setResolution("");
    } catch (err) {
      setError(err?.message || "Não foi possível resolver o incidente.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolver incidente</DialogTitle>
          <DialogDescription>Registre a resolução. A tarefa vinculada no Linear será resolvida automaticamente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="res-note">Resolução</Label>
            <textarea id="res-note" value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Descreva a causa e a ação tomada..." />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Resolver</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}