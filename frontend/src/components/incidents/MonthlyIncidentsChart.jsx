import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardBody } from "@/components/ui-primitives";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function buildMonthlySeries(items, monthsBack = 8) {
  const now = new Date();
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS_PT[d.getMonth()],
      value: 0,
    });
  }
  const index = {};
  buckets.forEach((b) => (index[b.key] = b));
  items.forEach((it) => {
    const raw = it.opened_at || it.created_date;
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (index[key]) index[key].value += 1;
  });
  return buckets;
}

export default function MonthlyIncidentsChart({ items }) {
  const data = useMemo(() => buildMonthlySeries(items || [], 8), [items]);

  const trend = useMemo(() => {
    if (data.length < 2) return { dir: "flat", diff: 0 };
    const last = data[data.length - 1].value;
    const prev = data[data.length - 2].value;
    const diff = last - prev;
    const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    return { dir, diff };
  }, [data]);

  const TrendIcon = trend.dir === "up" ? TrendingUp : trend.dir === "down" ? TrendingDown : Minus;
  const trendColor = trend.dir === "up" ? "text-rose-600" : trend.dir === "down" ? "text-emerald-600" : "text-slate-400";
  const trendLabel = trend.dir === "up" ? "subindo" : trend.dir === "down" ? "descendo" : "estável";

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Incidentes por mês</h2>
            <p className="text-xs text-slate-400">Volume mensal dos últimos 8 meses</p>
          </div>
          <div className={`inline-flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendLabel}
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="incVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ stroke: "#e2e8f0" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#incVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}