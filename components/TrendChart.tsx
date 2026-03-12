"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { DailyInsight } from "@/lib/meta";

interface Props {
  accountId: string;
  adId: string;
  adName: string;
  datePreset: string;
  onClose: () => void;
}

export default function TrendChart({ accountId, adId, adName, datePreset, onClose }: Props) {
  const [data, setData] = useState<DailyInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/daily?accountId=${accountId}&datePreset=${datePreset}`)
      .then((r) => r.json())
      .then((all: DailyInsight[]) => {
        const filtered = all
          .filter((d) => d.ad_id === adId)
          .sort((a, b) => a.date_start.localeCompare(b.date_start));
        setData(filtered);
      })
      .finally(() => setLoading(false));
  }, [accountId, adId, datePreset]);

  const chartData = data.map((d) => ({
    date: d.date_start.slice(5),
    Gasto: parseFloat(d.spend),
    CTR: parseFloat(d.ctr),
  }));

  return (
    <div className="mt-2 mb-4 bg-gray-900 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Evolución diaria</p>
          <p className="font-medium text-sm truncate max-w-[400px]">{adName}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
      </div>

      {loading && <p className="text-gray-500 text-sm py-6 text-center">Cargando...</p>}

      {!loading && chartData.length === 0 && (
        <p className="text-gray-500 text-sm py-6 text-center">Sin datos diarios para este anuncio.</p>
      )}

      {!loading && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} width={55}
              tickFormatter={(v) => `$${v.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} width={40}
              tickFormatter={(v) => `${v.toFixed(1)}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#d1d5db", marginBottom: 4 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const n = Number(value);
                const label = String(name);
                return label === "Gasto"
                  ? [`$${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`, label]
                  : [`${n.toFixed(2)}%`, label];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
            <Bar yAxisId="left" dataKey="Gasto" fill="#3b82f6" opacity={0.7} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" dataKey="CTR" stroke="#10b981" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
