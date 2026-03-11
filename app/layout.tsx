import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Ads — Reporte de Creativos",
  description: "Dashboard de performance de creativos de Meta Ads",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
