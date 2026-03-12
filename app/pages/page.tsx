"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Page } from "@/lib/pages";

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPages(data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-gray-300">Páginas</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">Posts Orgánicos</h1>
      <p className="text-gray-400 mb-10">Seleccioná una página para ver el engagement de sus posts.</p>

      {loading && <p className="text-gray-500">Cargando páginas...</p>}

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          <strong>Error:</strong> {error}
          {error.includes("190") && (
            <p className="mt-1 text-xs opacity-80">
              Verificá que tu token tenga el permiso <code>pages_read_engagement</code>.
            </p>
          )}
        </div>
      )}

      {!loading && !error && pages.length === 0 && (
        <p className="text-gray-500">
          No se encontraron páginas. Verificá que tu token tenga el permiso <code>pages_read_engagement</code>.
        </p>
      )}

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
                  src={page.picture.data.url}
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
    </main>
  );
}
