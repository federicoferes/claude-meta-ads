"use client";

import { useEffect, useState } from "react";
import type { AdAccount } from "@/lib/meta";
import type { Page } from "@/lib/pages";
import { clsx } from "clsx";

const DATE_PRESETS = [
  { value: "last_7d", label: "Últimos 7 días" },
  { value: "last_14d", label: "Últimos 14 días" },
  { value: "last_30d", label: "Últimos 30 días" },
  { value: "last_90d", label: "Últimos 90 días" },
];

interface BestAd {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  ctr: string;
  cpc: string;
  frequency: string;
  roas: number;
  cpa: number;
  thumbnail: string | null;
}

interface BestPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
  reach: number;
  impressions: number;
  engagement_rate: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions_paid: number;
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: decimals });
}
function fmtCurrency(n: number) {
  return `$${fmt(n, 2)}`;
}

export default function IntelligencePage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [accountId, setAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [datePreset, setDatePreset] = useState("last_30d");

  const [bestAd, setBestAd] = useState<BestAd | null>(null);
  const [bestPost, setBestPost] = useState<BestPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts and pages on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/pages").then((r) => r.json()),
    ]).then(([accs, pgs]) => {
      if (!accs.error) {
        setAccounts(accs);
        if (accs.length > 0) setAccountId(accs[0].id);
      }
      if (!pgs.error) {
        setPages(pgs);
        if (pgs.length > 0) setPageId(pgs[0].id);
      }
    });
  }, []);

  // Fetch intelligence when selections are ready
  useEffect(() => {
    if (!accountId || !pageId) return;
    setLoading(true);
    setError(null);
    setBestAd(null);
    setBestPost(null);

    fetch(`/api/intelligence?accountId=${accountId}&pageId=${pageId}&datePreset=${datePreset}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setBestAd(data.bestAd ?? null);
          setBestPost(data.bestPost ?? null);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [accountId, pageId, datePreset]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Creative Intelligence</h1>
        <p className="text-gray-500 text-sm">El mejor anuncio y el post con más engagement del período.</p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 mb-10">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
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

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 py-10">
          <span className="animate-pulse">Analizando el período...</span>
        </div>
      )}

      {!loading && (bestAd || bestPost) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BestAdCard ad={bestAd} />
          <BestPostCard post={bestPost} />
        </div>
      )}

      {!loading && !error && !bestAd && !bestPost && accountId && pageId && (
        <p className="text-gray-500 py-10">No hay datos para este período.</p>
      )}
    </main>
  );
}

function BestAdCard({ ad }: { ad: BestAd | null }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Paid Media</span>
          <h2 className="text-base font-bold mt-0.5">Mejor Anuncio</h2>
        </div>
        <span className="text-2xl">🏆</span>
      </div>

      {!ad ? (
        <div className="px-5 py-10 text-gray-600 text-sm">Sin datos de anuncios.</div>
      ) : (
        <>
          {/* Image */}
          <div className="w-full h-56 bg-gray-800 relative overflow-hidden">
            {ad.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.thumbnail}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm">Sin imagen</div>
            )}
          </div>

          {/* Info */}
          <div className="px-5 py-4">
            <p className="font-semibold text-white truncate">{ad.ad_name}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{ad.campaign_name}</p>

            {/* Primary metric */}
            <div className="mt-4 mb-4">
              {ad.roas > 0 ? (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">ROAS</span>
                  <p className="text-4xl font-bold text-green-400">{fmt(ad.roas, 2)}x</p>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">CTR</span>
                  <p className="text-4xl font-bold text-blue-400">{fmt(parseFloat(ad.ctr), 2)}%</p>
                </div>
              )}
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Gasto" value={fmtCurrency(parseFloat(ad.spend))} />
              <Metric label="CTR" value={`${fmt(parseFloat(ad.ctr), 2)}%`} />
              <Metric label="Frec." value={fmt(parseFloat(ad.frequency), 1)} />
              <Metric label="CPC" value={fmtCurrency(parseFloat(ad.cpc))} />
              <Metric label="Impresiones" value={fmt(parseFloat(ad.impressions))} />
              {ad.cpa > 0 && <Metric label="CPA" value={fmtCurrency(ad.cpa)} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BestPostCard({ post }: { post: BestPost | null }) {
  function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `hace ${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Social Media</span>
          <h2 className="text-base font-bold mt-0.5">Post con más Engagement</h2>
        </div>
        <span className="text-2xl">🔥</span>
      </div>

      {!post ? (
        <div className="px-5 py-10 text-gray-600 text-sm">Sin datos de posts.</div>
      ) : (
        <>
          {/* Image */}
          <div className="w-full h-56 bg-gray-800 relative overflow-hidden">
            {post.full_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.full_picture}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm">Sin imagen</div>
            )}
            {post.impressions_paid > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-semibold bg-blue-900/80 text-blue-300 border border-blue-700 rounded px-2 py-1">
                BOOSTEADO
              </span>
            )}
          </div>

          {/* Info */}
          <div className="px-5 py-4">
            <p className="text-xs text-gray-500 mb-2">{timeAgo(post.created_time)}</p>
            <p className="text-sm text-gray-300 line-clamp-2 mb-4">
              {post.message ?? post.story ?? <span className="text-gray-600 italic">Sin texto</span>}
            </p>

            {/* Primary metric */}
            <div className="mt-1 mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Engagement Rate</span>
              <p className={clsx(
                "text-4xl font-bold",
                post.engagement_rate >= 5 ? "text-green-400" : post.engagement_rate >= 2 ? "text-yellow-400" : "text-gray-300"
              )}>
                {fmt(post.engagement_rate, 1)}%
              </p>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Alcance" value={fmt(post.reach)} />
              <Metric label="Impresiones" value={fmt(post.impressions)} />
              <Metric label="Reacciones" value={fmt(post.reactions)} />
              <Metric label="Comentarios" value={fmt(post.comments)} />
              <Metric label="Shares" value={fmt(post.shares)} />
              <Metric label="Clicks" value={fmt(post.clicks)} />
            </div>

            <a
              href={post.permalink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-xs text-blue-500 hover:text-blue-400"
            >
              Ver post en Facebook ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/60 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  );
}
