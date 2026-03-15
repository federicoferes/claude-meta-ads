"use client";

import { useState } from "react";
import type { PagePost } from "@/lib/pages";
import { clsx } from "clsx";

interface Props {
  posts: PagePost[];
  source?: "facebook" | "instagram";
}

type SortKey = "reach" | "impressions" | "engagement_rate" | "reactions" | "comments" | "shares" | "clicks" | "saves";
type BoostFilter = "all" | "boosted" | "organic";

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: decimals });
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default function PostsTable({ posts, source = "facebook" }: Props) {
  const isIg = source === "instagram";
  const [sortKey, setSortKey] = useState<SortKey>("reach");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");
  const [filterBoost, setFilterBoost] = useState<BoostFilter>("all");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = posts.filter((p) => {
    const text = (p.message ?? p.story ?? "").toLowerCase();
    if (filterText && !text.includes(filterText.toLowerCase())) return false;
    if (filterBoost === "boosted" && p.impressions_paid === 0) return false;
    if (filterBoost === "organic" && p.impressions_paid > 0) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = sortKey === "saves" ? (a.saves ?? 0) : a[sortKey as keyof PagePost] as number;
    const vb = sortKey === "saves" ? (b.saves ?? 0) : b[sortKey as keyof PagePost] as number;
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const cols: { key: SortKey; label: string }[] = [
    { key: "reach", label: "Alcance" },
    { key: "impressions", label: "Impresiones" },
    { key: "engagement_rate", label: "Eng. Rate" },
    { key: "reactions", label: isIg ? "Likes" : "Reacciones" },
    { key: "comments", label: "Comentarios" },
    ...(isIg
      ? [{ key: "saves" as SortKey, label: "Guardados" }]
      : [{ key: "shares" as SortKey, label: "Shares" }, { key: "clicks" as SortKey, label: "Clicks" }]
    ),
  ];

  const hasFilters = filterText || filterBoost !== "all";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar en el texto del post..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        {!isIg && (
          <select
            value={filterBoost}
            onChange={(e) => setFilterBoost(e.target.value as BoostFilter)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los posts</option>
            <option value="boosted">Solo boosteados</option>
            <option value="organic">Solo orgánicos</option>
          </select>
        )}
        {hasFilters && (
          <button
            onClick={() => { setFilterText(""); setFilterBoost("all"); }}
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
              <th className="w-12 px-3 py-3" />
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Post</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">Fecha</th>
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
            {sorted.map((post) => {
              const text = post.message ?? post.story ?? "";
              const isBoosted = post.impressions_paid > 0;
              return (
                <tr key={post.id} className="border-b border-gray-800/60 hover:bg-gray-900/50 transition-colors">
                  <td className="px-3 py-3">
                    {post.full_picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/image?url=${encodeURIComponent(post.full_picture!)}`}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-md bg-gray-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-800 flex items-center justify-center text-gray-600 text-xs">img</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      {isBoosted && (
                        <span className="text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-800 rounded px-1.5 py-0.5 whitespace-nowrap">
                          BOOSTEADO
                        </span>
                      )}
                    </div>
                    <p className="text-gray-200 text-xs leading-relaxed line-clamp-2">
                      {text || <span className="text-gray-600 italic">Sin texto</span>}
                    </p>
                    <a
                      href={post.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-blue-500 hover:text-blue-400 mt-0.5 inline-block"
                    >
                      Ver post ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {timeAgo(post.created_time)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(post.reach)}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{fmt(post.impressions)}</td>
                  <td className={clsx(
                    "px-4 py-3 text-right font-semibold",
                    post.engagement_rate >= 5 ? "text-green-400" :
                    post.engagement_rate >= 2 ? "text-yellow-400" : "text-gray-400"
                  )}>
                    {fmt(post.engagement_rate, 1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{fmt(post.reactions)}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{fmt(post.comments)}</td>
                  {isIg
                    ? <td className="px-4 py-3 text-right text-gray-300">{fmt(post.saves ?? 0)}</td>
                    : <>
                        <td className="px-4 py-3 text-right text-gray-300">{fmt(post.shares)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{fmt(post.clicks)}</td>
                      </>
                  }
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            {filtered.length === 0 && posts.length > 0
              ? "Ningún post coincide con los filtros."
              : "No hay posts para este período."}
          </p>
        )}
      </div>
    </div>
  );
}
