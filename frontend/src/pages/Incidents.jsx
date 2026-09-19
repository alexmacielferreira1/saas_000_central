import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrgId } from "@/lib/TenantContext";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import IncidentCharts from "@/components/incidents/IncidentCharts";
import { INCIDENT_SEVERITY, INCIDENT_STATUS, fmtDate } from "@/lib/adminHelpers";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewIncidentDialog from "@/components/incidents/NewIncidentDialog";
import IncidentCard from "@/components/incidents/IncidentCard";
import { usePermissions } from "@/hooks/usePermissions";

export default function Incidents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(false);

  const orgId = useOrgId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await base44.entities.Incident.filter({ organization_id: orgId }, "-opened_at", 50);
      setItems(data || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [orgId]);

  useEffect(() => {
    if (searchParams.get("novo") === "incident" && can("incident")) {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  return (
    <div>
      <PageHeader
        title="Incidentes & Problemas"
        description="Problemas abertos e monitorados no ecossistema."
        icon={AlertTriangle}
        actions={can("incident") ? <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Registrar incidente</Button> : undefined}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => <div key={n} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar os incidentes." /></Card>
      ) : items.length === 0 ? (
        <Card><EmptyState icon={AlertTriangle} title="Nenhum incidente" description="Tudo limpo por aqui." /></Card>
      ) : (
        <>
        <IncidentCharts items={items} />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <IncidentCard key={i.id} incident={i} onUpdated={load} />
          ))}
        </div>
        </>
      )}

      <NewIncidentDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
    </div>
  );
}