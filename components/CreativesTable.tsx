"use client";

import { useState } from "react";
import type { CreativeInsight } from "@/lib/meta";
import { calcROAS, calcCPA } from "@/lib/meta";
import { clsx } from "clsx";

interface Props {
  insights: CreativeInsight[];
}

type SortKey = "spend" | "impressions" | "ctr" | "cpc" | "cpm" | "frequency" | "roas" | "cpa";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: decimals });
}

function fmtCurrency(n: number) {
  return `$${fmt(n, 2)}`;
}

export default function CreativesTable({ insights }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...insights].sort((a, b) => {
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
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">Anuncio</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">Campaña</th>
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-right px-4 py-3 text-gray-400 font-medium whitespace-nowrap cursor-pointer hover:text-white select-none"
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ad) => {
            const roas = calcROAS(ad);
            const cpa = calcCPA(ad);
            const freq = parseFloat(ad.frequency);
            return (
              <tr key={ad.ad_id} className="border-b border-gray-800/60 hover:bg-gray-900/50 transition-colors">
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
                <td className="px-4 py-3 text-right">{fmt(parseFloat(ad.ctr))}%</td>
                <td className="px-4 py-3 text-right">{fmtCurrency(parseFloat(ad.cpc))}</td>
                <td className="px-4 py-3 text-right">{fmtCurrency(parseFloat(ad.cpm))}</td>
                <td className={clsx("px-4 py-3 text-right font-semibold", roas >= 3 ? "text-green-400" : roas > 0 ? "text-yellow-400" : "text-gray-500")}>
                  {roas > 0 ? fmt(roas) + "x" : "—"}
                </td>
                <td className="px-4 py-3 text-right">{cpa > 0 ? fmtCurrency(cpa) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-10">No hay datos para este período.</p>
      )}
    </div>
  );
}
