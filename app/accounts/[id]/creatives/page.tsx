"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CreativeInsight } from "@/lib/meta";
import { detectFatigue } from "@/lib/fatigue";
import CreativesTable from "@/components/CreativesTable";
import FatigueAlerts from "@/components/FatigueAlerts";

const DATE_PRESETS = [
  { value: "yesterday", label: "Ayer" },
  { value: "last_7d", label: "Últimos 7 días" },
  { value: "last_14d", label: "Últimos 14 días" },
  { value: "last_30d", label: "Últimos 30 días" },
  { value: "last_90d", label: "Últimos 90 días" },
];

export default function CreativesPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accountName = searchParams.get("name") ?? id;

  const [insights, setInsights] = useState<CreativeInsight[]>([]);
  const [previous, setPrevious] = useState<CreativeInsight[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState("last_30d");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/insights?accountId=${id}&datePreset=${datePreset}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setInsights(data.current ?? []);
          setPrevious(data.previous ?? []);
          setThumbnails(data.thumbnails ?? {});
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id, datePreset]);

  const alerts = detectFatigue(insights, previous);
  const totalSpend = insights.reduce((s, a) => s + parseFloat(a.spend), 0);
  const totalImpressions = insights.reduce((s, a) => s + parseFloat(a.impressions), 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">Cuentas</Link>
        <span>/</span>
        <span className="text-gray-300">{accountName}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{accountName}</h1>
          <p className="text-gray-500 text-sm mt-1">Reporte de Creativos</p>
        </div>
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Anuncios" value={String(insights.length)} />
        <SummaryCard label="Gasto total" value={`$${totalSpend.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`} />
        <SummaryCard label="Impresiones" value={totalImpressions.toLocaleString("es-AR", { maximumFractionDigits: 0 })} />
        <SummaryCard label="Alertas de fatiga" value={String(alerts.length)} highlight={alerts.length > 0} />
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando datos...</p>
      ) : (
        <>
          <FatigueAlerts alerts={alerts} />
          <p className="text-xs text-gray-600 mb-3">Hacé clic en una fila para ver la evolución diaria.</p>
          <CreativesTable
            insights={insights}
            previous={previous}
            alerts={alerts}
            thumbnails={thumbnails}
            accountId={id}
            datePreset={datePreset}
          />
        </>
      )}
    </main>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-yellow-400" : "text-white"}`}>{value}</div>
    </div>
  );
}
