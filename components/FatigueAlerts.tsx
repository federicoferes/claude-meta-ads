"use client";

import type { FatigueAlert } from "@/lib/fatigue";

interface Props {
  alerts: FatigueAlert[];
}

const icons = {
  frequency: "🔁",
  ctr_drop: "📉",
  cpa_rise: "💸",
};

export default function FatigueAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Alertas de fatiga ({alerts.length})
      </h2>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm border ${
              alert.severity === "critical"
                ? "bg-red-900/30 border-red-700 text-red-300"
                : "bg-yellow-900/30 border-yellow-700 text-yellow-300"
            }`}
          >
            <span>{icons[alert.type]}</span>
            <div>
              <span className="font-medium">{alert.ad_name}</span>
              <span className="text-gray-400 mx-2">·</span>
              {alert.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
