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
    `${BASE_URL}/me/adaccounts?fields=id,name,currency,account_status&limit=200&access_token=${TOKEN}`
  );
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
  const data = await res.json();
  const all: AdAccount[] = data.data ?? [];

  const allowedIds = process.env.META_AD_ACCOUNT_IDS?.split(",").map((id) => id.trim()) ?? [];
  if (allowedIds.length === 0) return all.filter((a) => a.account_status === 1);
  return all.filter((a) => allowedIds.includes(a.id) && a.account_status === 1);
}

const PRESET_DAYS: Record<string, number> = {
  yesterday: 1,
  last_7d: 7,
  last_14d: 14,
  last_30d: 30,
  last_90d: 90,
};

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getPreviousPeriodRange(datePreset: string): { since: string; until: string } {
  const days = PRESET_DAYS[datePreset] ?? 30;
  const until = new Date();
  until.setDate(until.getDate() - days);
  const since = new Date(until);
  since.setDate(since.getDate() - days);
  return { since: toYMD(since), until: toYMD(until) };
}

const FIELDS = [
  "ad_id", "ad_name", "adset_name", "campaign_name",
  "spend", "impressions", "reach", "frequency",
  "clicks", "ctr", "cpc", "cpm",
  "actions", "action_values",
  "video_avg_time_watched_actions",
  "video_p25_watched_actions", "video_p50_watched_actions",
  "video_p75_watched_actions", "video_p100_watched_actions",
].join(",");

export async function getCreativeInsights(
  accountId: string,
  datePreset: string = "last_30d"
): Promise<CreativeInsight[]> {
  const url = `${BASE_URL}/${accountId}/insights?level=ad&fields=${FIELDS}&date_preset=${datePreset}&limit=500&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

export async function getPreviousCreativeInsights(
  accountId: string,
  datePreset: string = "last_30d"
): Promise<CreativeInsight[]> {
  const { since, until } = getPreviousPeriodRange(datePreset);
  const url = `${BASE_URL}/${accountId}/insights?level=ad&fields=${FIELDS}&time_range={"since":"${since}","until":"${until}"}&limit=500&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export interface DailyInsight {
  ad_id: string;
  date_start: string;
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
}

export async function getAdThumbnails(accountId: string): Promise<Record<string, string>> {
  const url = `${BASE_URL}/${accountId}/ads?fields=id,creative{thumbnail_url}&limit=500&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const ad of (data.data ?? [])) {
    if (ad.creative?.thumbnail_url) map[ad.id] = ad.creative.thumbnail_url;
  }
  return map;
}

export async function getDailyInsights(accountId: string, datePreset: string): Promise<DailyInsight[]> {
  const fields = "ad_id,date_start,spend,impressions,clicks,ctr,actions,action_values";
  const url = `${BASE_URL}/${accountId}/insights?level=ad&fields=${fields}&date_preset=${datePreset}&time_increment=1&limit=1000&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
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
