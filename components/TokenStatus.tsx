"use client";

import { useEffect, useState } from "react";

interface TokenInfo {
  valid: boolean;
  daysLeft: number | null;
  error?: string;
}

export default function TokenStatus() {
  const [status, setStatus] = useState<TokenInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/token")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setNewToken(null);
    try {
      const res = await fetch("/api/token", { method: "POST" });
      const data = await res.json() as { token?: string; error?: string; expiresInDays?: number };
      if (data.error) {
        alert(`Error al renovar el token: ${data.error}`);
      } else if (data.token) {
        setNewToken(data.token);
        fetch("/api/token").then((r) => r.json()).then(setStatus).catch(() => null);
      }
    } finally {
      setRefreshing(false);
    }
  }

  function copyToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!status) return null;

  const { daysLeft, valid } = status;
  const isCritical = !valid || (daysLeft !== null && daysLeft <= 3);
  const isWarning = valid && daysLeft !== null && daysLeft <= 10 && daysLeft > 3;

  if (valid && !isWarning && !isCritical && !newToken) return null;

  return (
    <div className={`border rounded-lg p-3 text-sm mb-6 ${
      isCritical ? "bg-red-900/40 border-red-700 text-red-300" :
      isWarning   ? "bg-yellow-900/30 border-yellow-700 text-yellow-300" :
                    "bg-green-900/20 border-green-800 text-green-400"
    }`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span>
          {isCritical ? "🔴" : "🟡"}{" "}
          {!valid
            ? `Token de Meta inválido o vencido${status.error ? `: ${status.error}` : ""}`
            : `Token de Meta vence en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`}
        </span>
        {!newToken && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-3 py-1 text-xs text-white transition-colors disabled:opacity-50"
          >
            {refreshing ? "Renovando..." : "Renovar token"}
          </button>
        )}
      </div>

      {newToken && (
        <div className="mt-3 space-y-2">
          <p className="text-xs opacity-80">
            ✅ Token renovado. Copialo y actualizá <code>META_ACCESS_TOKEN</code> en <code>.env.local</code> y en Vercel:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-900 rounded px-2 py-1.5 text-xs text-gray-200 truncate font-mono">
              {newToken}
            </code>
            <button
              onClick={copyToken}
              className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded px-3 py-1 text-xs text-white transition-colors whitespace-nowrap"
            >
              {copied ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
