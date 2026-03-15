"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Page, IgAccount } from "@/lib/pages";

export default function SocialMediaPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [igAccounts, setIgAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/pages").then((r) => r.json()),
      fetch("/api/instagram").then((r) => r.json()),
    ])
      .then(([pgs, igs]) => {
        if (!pgs.error) setPages(pgs);
        else setError(pgs.error);
        if (!Array.isArray(igs)) return;
        setIgAccounts(igs);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-gray-300">Social Media</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">Social Media</h1>
      <p className="text-gray-400 mb-10">Seleccioná una cuenta para ver el engagement de sus posts.</p>

      {loading && <p className="text-gray-500">Cargando cuentas...</p>}

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Instagram accounts */}
      {igAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>📷</span> Instagram
          </h2>
          <ul className="space-y-3">
            {igAccounts.map((account) => (
              <li key={account.id}>
                <button
                  onClick={() => router.push(`/instagram/${account.id}/posts?name=${encodeURIComponent(account.username)}`)}
                  className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-pink-600 rounded-xl px-5 py-4 transition-colors flex items-center gap-4"
                >
                  {account.profile_picture_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/image?url=${encodeURIComponent(account.profile_picture_url)}`}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-gray-800 flex-shrink-0"
                    />
                  )}
                  <div>
                    <div className="font-medium">@{account.username}</div>
                    {account.followers_count > 0 && (
                      <div className="text-sm text-gray-400 mt-0.5">
                        {account.followers_count.toLocaleString("es-AR")} seguidores
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Facebook pages */}
      {pages.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>📘</span> Facebook
          </h2>
          <ul className="space-y-3">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  onClick={() => router.push(`/pages/${page.id}/posts?name=${encodeURIComponent(page.name)}`)}
                  className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-blue-600 rounded-xl px-5 py-4 transition-colors flex items-center gap-4"
                >
                  {page.picture?.data?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/image?url=${encodeURIComponent(page.picture.data.url)}`}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-gray-800 flex-shrink-0"
                    />
                  )}
                  <div>
                    <div className="font-medium">{page.name}</div>
                    {page.fan_count > 0 && (
                      <div className="text-sm text-gray-400 mt-0.5">
                        {page.fan_count.toLocaleString("es-AR")} seguidores
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && pages.length === 0 && igAccounts.length === 0 && (
        <p className="text-gray-500">
          No se encontraron cuentas. Verificá que tu token tenga los permisos <code>pages_read_engagement</code> e <code>instagram_basic</code>.
        </p>
      )}
    </main>
  );
}
