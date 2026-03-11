const BASE_URL = "https://graph.facebook.com/v19.0";
const TOKEN = process.env.META_ACCESS_TOKEN;

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
}

export interface CreativeInsight {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions: { action_type: string; value: string }[];
  action_values: { action_type: string; value: string }[];
  video_avg_time_watched_actions?: { action_type: string; value: string }[];
  video_p25_watched_actions?: { action_type: string; value: string }[];
  video_p50_watched_actions?: { action_type: string; value: string }[];
  video_p75_watched_actions?: { action_type: string; value: string }[];
  video_p100_watched_actions?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export async function getAdAccounts(): Promise<AdAccount[]> {
  const res = await fetch(
    `${BASE_URL}/me/adaccounts?fields=id,name,currency,account_status&access_token=${TOKEN}`
  );
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

export async function getCreativeInsights(
  accountId: string,
  datePreset: string = "last_30d"
): Promise<CreativeInsight[]> {
  const fields = [
    "ad_id",
    "ad_name",
    "adset_name",
    "campaign_name",
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
    "action_values",
    "video_avg_time_watched_actions",
    "video_p25_watched_actions",
    "video_p50_watched_actions",
    "video_p75_watched_actions",
    "video_p100_watched_actions",
  ].join(",");

  const url = `${BASE_URL}/${accountId}/insights?level=ad&fields=${fields}&date_preset=${datePreset}&limit=500&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

export function getActionValue(
  actions: { action_type: string; value: string }[] | undefined,
  type: string
): number {
  return parseFloat(actions?.find((a) => a.action_type === type)?.value ?? "0");
}

export function calcROAS(insight: CreativeInsight): number {
  const revenue = getActionValue(insight.action_values, "purchase");
  const spend = parseFloat(insight.spend);
  if (!spend) return 0;
  return revenue / spend;
}

export function calcCPA(insight: CreativeInsight): number {
  const conversions = getActionValue(insight.actions, "purchase");
  const spend = parseFloat(insight.spend);
  if (!conversions) return 0;
  return spend / conversions;
}
