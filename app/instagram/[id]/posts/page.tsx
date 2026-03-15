"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { PagePost } from "@/lib/pages";
import PostsTable from "@/components/PostsTable";

const DATE_PRESETS = [
  { value: "last_7d", label: "Últimos 7 días" },
  { value: "last_14d", label: "Últimos 14 días" },
  { value: "last_30d", label: "Últimos 30 días" },
  { value: "last_90d", label: "Últimos 90 días" },
];

export default function IgPostsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accountName = searchParams.get("name") ?? id;

  const [posts, setPosts] = useState<PagePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState("last_30d");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/instagram/${id}/posts?datePreset=${datePreset}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPosts(data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id, datePreset]);

  const totalReach = posts.reduce((s, p) => s + p.reach, 0);
  const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
  const avgEngagement = posts.length > 0
    ? posts.reduce((s, p) => s + p.engagement_rate, 0) / posts.length
    : 0;
  const totalSaves = posts.reduce((s, p) => s + (p.saves ?? 0), 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/pages" className="hover:text-white transition-colors">Social Media</Link>
        <span>/</span>
        <span className="text-gray-300">@{accountName}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📷</span>
            <h1 className="text-2xl font-bold">@{accountName}</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Engagement de Posts de Instagram</p>
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
        <SummaryCard label="Posts" value={String(posts.length)} />
        <SummaryCard label="Alcance total" value={totalReach.toLocaleString("es-AR", { maximumFractionDigits: 0 })} />
        <SummaryCard label="Impresiones" value={totalImpressions.toLocaleString("es-AR", { maximumFractionDigits: 0 })} />
        <SummaryCard
          label="Eng. rate prom."
          value={`${avgEngagement.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`}
          highlight={avgEngagement >= 3}
        />
      </div>

      {totalSaves > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          {totalSaves.toLocaleString("es-AR")} guardados totales en el período.
        </p>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando posts...</p>
      ) : (
        <PostsTable posts={posts} source="instagram" />
      )}
    </main>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-green-400" : "text-white"}`}>{value}</div>
    </div>
  );
}
