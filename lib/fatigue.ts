import type { CreativeInsight } from "./meta";

export interface FatigueAlert {
  ad_id: string;
  ad_name: string;
  type: "frequency" | "ctr_drop" | "cpa_rise";
  message: string;
  severity: "warning" | "critical";
}

export const THRESHOLDS = {
  frequency: 3,
  ctrDropPct: 20,
  cpaRisePct: 30,
};

export function detectFatigue(
  current: CreativeInsight[],
  previous?: CreativeInsight[]
): FatigueAlert[] {
  const alerts: FatigueAlert[] = [];

  for (const ad of current) {
    const frequency = parseFloat(ad.frequency);
    const ctr = parseFloat(ad.ctr);

    if (frequency > THRESHOLDS.frequency) {
      alerts.push({
        ad_id: ad.ad_id,
        ad_name: ad.ad_name,
        type: "frequency",
        message: `Frecuencia ${frequency.toFixed(1)} — supera el umbral de ${THRESHOLDS.frequency}`,
        severity: frequency > THRESHOLDS.frequency * 1.5 ? "critical" : "warning",
      });
    }

    if (previous) {
      const prev = previous.find((p) => p.ad_id === ad.ad_id);
      if (prev) {
        const prevCtr = parseFloat(prev.ctr);
        if (prevCtr > 0) {
          const ctrDrop = ((prevCtr - ctr) / prevCtr) * 100;
          if (ctrDrop > THRESHOLDS.ctrDropPct) {
            alerts.push({
              ad_id: ad.ad_id,
              ad_name: ad.ad_name,
              type: "ctr_drop",
              message: `CTR cayó ${ctrDrop.toFixed(0)}% vs período anterior`,
              severity: ctrDrop > 40 ? "critical" : "warning",
            });
          }
        }

        const prevSpend = parseFloat(prev.spend);
        const prevConversions = parseFloat(
          prev.actions?.find((a) => a.action_type === "purchase")?.value ?? "0"
        );
        const curSpend = parseFloat(ad.spend);
        const curConversions = parseFloat(
          ad.actions?.find((a) => a.action_type === "purchase")?.value ?? "0"
        );

        if (prevConversions > 0 && curConversions > 0) {
          const prevCpa = prevSpend / prevConversions;
          const curCpa = curSpend / curConversions;
          const cpaRise = ((curCpa - prevCpa) / prevCpa) * 100;
          if (cpaRise > THRESHOLDS.cpaRisePct) {
            alerts.push({
              ad_id: ad.ad_id,
              ad_name: ad.ad_name,
              type: "cpa_rise",
              message: `CPA subió ${cpaRise.toFixed(0)}% vs período anterior`,
              severity: cpaRise > 60 ? "critical" : "warning",
            });
          }
        }
      }
    }
  }

  return alerts;
}
