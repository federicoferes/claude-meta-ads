"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { label: "Paid Media", href: "/" },
  { label: "Social Media", href: "/pages" },
  { label: "Creative Intelligence", href: "/intelligence" },
];

export default function NavTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/accounts");
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive(tab.href)
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
