"use client";

import { useState } from "react";
import type { CreativeInsight } from "@/lib/meta";
import { calcROAS, calcCPA } from "@/lib/meta";
import type { FatigueAlert } from "@/lib/fatigue";
import { clsx } from "clsx";

interface Props {
  insights: CreativeInsight[];
  previous: CreativeInsight[];
  alerts: FatigueAlert[];
  thumbnails: Record<string, string>;
  accountId: string;
  datePreset: string;
}

type SortKey = "alerts" | "spend" | "impressions" | "ctr" | "cpc" | "cpm" | "frequency" | "roas" | "cpa";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: decimals });
}
function fmtCurrency(n: number) {
  return `$${fmt(n, 2)}`;
}

function alertScore(adId: string, alerts: FatigueAlert[]): number {
  const adAlerts = alerts.filter((a) => a.ad_id === adId);
  if (adAlerts.some((a) => a.severity === "critical")) return 2;
  if (adAlerts.some((a) => a.severity === "warning")) return 1;
  return 0;
}

function Delta({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous || !current) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 2) return null;
  const positive = pct > 0;
  const good = inverse ? !positive : positive;
  return (
    <span className={clsx("ml-1.5 text-xs font-normal", good ? "text-green-400" : "text-red-400")}>
      {positive ? "↑" : "↓"}{Math.abs(pct).toFixed(0)}%
    </span>
  );
}

type AlertFilter = "all" | "any" | "critical" | "warning" | "none";

export default function CreativesTable({ insights, previous, alerts, thumbnails, accountId, datePreset }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("alerts");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterAlert, setFilterAlert] = useState<AlertFilter>("all");

  // Lazy import TrendChart to avoid SSR issues
  const [TrendChart, setTrendChart] = useState<React.ComponentType<any> | null>(null);
  function handleRowClick(adId: string) {
    if (!TrendChart) {
      import("@/components/TrendChart").then((m) => setTrendChart(() => m.default));
    }
    setSelectedAdId((prev) => (prev === adId ? null : adId));
  }

  const prevMap = Object.fromEntries(previous.map((p) => [p.ad_id, p]));

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = insights.filter((ad) => {
    if (filterName && !ad.ad_name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterAlert !== "all") {
      const score = alertScore(ad.ad_id, alerts);
      if (filterAlert === "any" && score === 0) return false;
      if (filterAlert === "critical" && score !== 2) return false;
      if (filterAlert === "warning" && score !== 1) return false;
      if (filterAlert === "none" && score !== 0) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "alerts") {
      const diff = alertScore(b.ad_id, alerts) - alertScore(a.ad_id, alerts);
      if (diff !== 0) return diff;
      return parseFloat(b.spend) - parseFloat(a.spend);
    }
    let va = 0, vb = 0;
    if (sortKey === "roas") { va = calcROAS(a); vb = calcROAS(b); }
    else if (sortKey === "cpa") { va = calcCPA(a); vb = calcCPA(b); }
    else { va = parseFloat((a as any)[sortKey]); vb = parseFloat((b as any)[sortKey]); }
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const cols: { key: SortKey; label: string }[] = [
    { key: "spend", label: "Gasto" },
    { key: "impressions", label: "Impresiones" },
    { key: "frequency", label: "Frec." },
    { key: "ctr", label: "CTR" },
    { key: "cpc", label: "CPC" },
    { key: "cpm", label: "CPM" },
    { key: "roas", label: "ROAS" },
    { key: "cpa", label: "CPA" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre de anuncio..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <select
          value={filterAlert}
          onChange={(e) => setFilterAlert(e.target.value as AlertFilter)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todas las alertas</option>
          <option value="any">Con alguna alerta</option>
          <option value="critical">Solo críticas</option>
          <option value="warning">Solo advertencias</option>
          <option value="none">Sin alertas</option>
        </select>
        {(filterName || filterAlert !== "all") && (
          <button
            onClick={() => { setFilterName(""); setFilterAlert("all"); }}
            className="text-xs text-gray-500 hover:text-white px-3 py-2 border border-gray-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="w-10 px-3 py-3" />
            <th
              onClick={() => handleSort("alerts")}
              className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap cursor-pointer hover:text-white select-none"
            >
              Anuncio {sortKey === "alerts" && <span className="ml-1">↓</span>}
            </th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">Campaña</th>
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-right px-4 py-3 text-gray-400 font-medium whitespace-nowrap cursor-pointer hover:text-white select-none"
              >
                {col.label}
                {sortKey === col.key && <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ad) => {
            const roas = calcROAS(ad);
            const cpa = calcCPA(ad);
            const freq = parseFloat(ad.frequency);
            const ctr = parseFloat(ad.ctr);
            const prev = prevMap[ad.ad_id];
            const prevRoas = prev ? calcROAS(prev) : 0;
            const prevCpa = prev ? calcCPA(prev) : 0;
            const prevCtr = prev ? parseFloat(prev.ctr) : 0;
            const score = alertScore(ad.ad_id, alerts);
            const isSelected = selectedAdId === ad.ad_id;

            return (
              <>
                <tr
                  key={ad.ad_id}
                  onClick={() => handleRowClick(ad.ad_id)}
                  className={clsx(
                    "border-b border-gray-800/60 cursor-pointer transition-colors",
                    isSelected ? "bg-gray-800/70" : "hover:bg-gray-900/50",
                    score === 2 && "border-l-2 border-l-red-500",
                    score === 1 && "border-l-2 border-l-yellow-500"
                  )}
                >
                  <td className="px-3 py-3">
                    {thumbnails[ad.ad_id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnails[ad.ad_id]}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-md bg-gray-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center text-gray-600 text-xs">img</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="font-medium truncate">{ad.ad_name}</div>
                    <div className="text-xs text-gray-500 truncate">{ad.adset_name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[160px]">
                    <div className="truncate">{ad.campaign_name}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{fmtCurrency(parseFloat(ad.spend))}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{fmt(parseFloat(ad.impressions), 0)}</td>
                  <td className={clsx("px-4 py-3 text-right font-medium", freq > 3 ? "text-yellow-400" : "text-gray-300")}>
                    {fmt(freq)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fmt(ctr)}%
                    <Delta current={ctr} previous={prevCtr} />
                  </td>
                  <td className="px-4 py-3 text-right">{fmtCurrency(parseFloat(ad.cpc))}</td>
                  <td className="px-4 py-3 text-right">{fmtCurrency(parseFloat(ad.cpm))}</td>
                  <td className={clsx("px-4 py-3 text-right font-semibold", roas >= 3 ? "text-green-400" : roas > 0 ? "text-yellow-400" : "text-gray-500")}>
                    {roas > 0 ? fmt(roas) + "x" : "—"}
                    {roas > 0 && prevRoas > 0 && <Delta current={roas} previous={prevRoas} />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {cpa > 0 ? fmtCurrency(cpa) : "—"}
                    {cpa > 0 && prevCpa > 0 && <Delta current={cpa} previous={prevCpa} inverse />}
                  </td>
                </tr>
                {isSelected && TrendChart && (
                  <tr key={`${ad.ad_id}-chart`} className="border-b border-gray-800/60 bg-gray-900/30">
                    <td colSpan={11} className="px-4 py-2">
                      <TrendChart
                        accountId={accountId}
                        adId={ad.ad_id}
                        adName={ad.ad_name}
                        datePreset={datePreset}
                        onClose={() => setSelectedAdId(null)}
                      />
                    </td>
                  </tr>
                )}
                {isSelected && !TrendChart && (
                  <tr key={`${ad.ad_id}-loading`} className="border-b border-gray-800/60">
                    <td colSpan={11} className="px-4 py-3 text-gray-500 text-sm">Cargando gráfico...</td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          {filtered.length === 0 && insights.length > 0
            ? "Ningún anuncio coincide con los filtros."
            : "No hay datos para este período."}
        </p>
      )}
    </div>
    </div>
  );
}
