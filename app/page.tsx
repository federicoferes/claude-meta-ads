"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdAccount } from "@/lib/meta";
import TokenStatus from "@/components/TokenStatus";
import Link from "next/link";

export default function HomePage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setAccounts(data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold">Meta Ads Reporting</h1>
        <Link
          href="/pages"
          className="text-sm text-blue-400 hover:text-blue-300 border border-blue-900 hover:border-blue-700 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
        >
          Posts orgánicos →
        </Link>
      </div>
      <p className="text-gray-400 mb-10">Seleccioná una cuenta para ver el reporte de creativos.</p>

      <TokenStatus />

      {loading && <p className="text-gray-500">Cargando cuentas...</p>}

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <p className="text-gray-500">No se encontraron cuentas. Verificá tu access token en <code>.env.local</code>.</p>
      )}

      <ul className="space-y-3">
        {accounts.map((account) => (
          <li key={account.id}>
            <button
              onClick={() => router.push(`/accounts/${account.id}/creatives?name=${encodeURIComponent(account.name)}`)}
              className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-blue-600 rounded-xl px-5 py-4 transition-colors"
            >
              <div className="font-medium">{account.name}</div>
              <div className="text-sm text-gray-400 mt-0.5">{account.id} · {account.currency}</div>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
