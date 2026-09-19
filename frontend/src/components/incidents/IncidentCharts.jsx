import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardBody } from "@/components/ui-primitives";
import { INCIDENT_SEVERITY, INCIDENT_STATUS } from "@/lib/adminHelpers";

const SEVERITY_COLORS = {
  low: "#94a3b8",
  medium: "#0ea5e9",
  high: "#f59e0b",
  critical: "#f43f5e",
};
const STATUS_COLORS = {
  open: "#f43f5e",
  investigating: "#f59e0b",
  resolved: "#10b981",
  monitoring: "#0ea5e9",
};

function buildCounts(items, map, key) {
  const order = Object.keys(map);
  const counts = {};
  order.forEach((k) => (counts[k] = 0));
  items.forEach((i) => {
    const v = i[key];
    if (v && counts[v] !== undefined) counts[v] += 1;
  });
  return order.map((k) => ({ name: map[k].label, value: counts[k], color: (key === "severity" ? SEVERITY_COLORS : STATUS_COLORS)[k], key: k }));
}

function ChartCard({ title, subtitle, data }) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <span className="text-xs text-slate-400">{subtitle}</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

export default function IncidentCharts({ items }) {
  const severityData = useMemo(() => buildCounts(items, INCIDENT_SEVERITY, "severity"), [items]);
  const statusData = useMemo(() => buildCounts(items, INCIDENT_STATUS, "status"), [items]);
  const total = items.length;
  const openCount = statusData.find((s) => s.key === "open")?.value || 0;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard title="Por severidade" subtitle={`${total} incidentes`} data={severityData} />
      <ChartCard title="Por status" subtitle={`${openCount} abertos`} data={statusData} />
    </div>
  );
}