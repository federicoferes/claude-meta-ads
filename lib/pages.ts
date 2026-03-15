const BASE_URL = "https://graph.facebook.com/v19.0";
const TOKEN = process.env.META_ACCESS_TOKEN;

export interface Page {
  id: string;
  name: string;
  fan_count: number;
  picture?: { data: { url: string } };
}

export interface PagePost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
  impressions: number;
  impressions_paid: number;
  reach: number;
  engaged_users: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  saves?: number;
  engagement_rate: number;
  source?: "facebook" | "instagram";
}

export interface IgAccount {
  id: string;
  name: string;
  username: string;
  profile_picture_url?: string;
  followers_count: number;
}

const PRESET_DAYS: Record<string, number> = {
  yesterday: 1,
  last_7d: 7,
  last_14d: 14,
  last_30d: 30,
  last_90d: 90,
};

function getDateRange(datePreset: string) {
  const days = PRESET_DAYS[datePreset] ?? 30;
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - days);
  return {
    since: Math.floor(since.getTime() / 1000),
    until: Math.floor(until.getTime() / 1000),
  };
}

export async function getPages(): Promise<Page[]> {
  const res = await fetch(
    `${BASE_URL}/me/accounts?fields=id,name,fan_count,picture&limit=100&access_token=${TOKEN}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}


const INSIGHT_METRICS = "post_impressions,post_impressions_paid,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks";

type InsightItem = { name: string; values: { value: number | Record<string, number> }[] };

function parseInsightData(data: { data?: InsightItem[] }) {
  const getVal = (name: string): number => {
    const item = (data.data ?? []).find((d) => d.name === name);
    const val = item?.values?.[0]?.value;
    if (val == null) return 0;
    if (typeof val === "object") return Object.values(val as Record<string, number>).reduce((a, b) => a + b, 0);
    return val as number;
  };
  const reach = getVal("post_impressions_unique");
  const engaged = getVal("post_engaged_users");
  return {
    impressions: getVal("post_impressions"),
    impressions_paid: getVal("post_impressions_paid"),
    reach,
    engaged_users: engaged,
    reactions: getVal("post_reactions_by_type_total"),
    clicks: getVal("post_clicks"),
    engagement_rate: reach > 0 ? (engaged / reach) * 100 : 0,
  };
}

// Use Meta Batch API to fetch all post insights in a single HTTP request
async function batchPostInsights(postIds: string[], pageToken: string) {
  const batch = postIds.map((id) => ({
    method: "GET",
    relative_url: `${id}/insights?metric=${INSIGHT_METRICS}&period=lifetime`,
  }));

  const body = new URLSearchParams({
    access_token: pageToken,
    batch: JSON.stringify(batch),
  });

  const res = await fetch("https://graph.facebook.com/v19.0", {
    method: "POST",
    body,
    next: { revalidate: 900 },
  });

  if (!res.ok) return postIds.map(() => null);
  const results = await res.json() as ({ code: number; body: string } | null)[];

  return results.map((result) => {
    if (!result || result.code !== 200) return null;
    try {
      return parseInsightData(JSON.parse(result.body));
    } catch {
      return null;
    }
  });
}

export async function getIgAccounts(): Promise<IgAccount[]> {
  const res = await fetch(
    `${BASE_URL}/me/accounts?fields=id,instagram_business_account{id,name,username,profile_picture_url,followers_count}&limit=100&access_token=${TOKEN}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? [])
    .filter((p: { instagram_business_account?: IgAccount }) => p.instagram_business_account)
    .map((p: { instagram_business_account: IgAccount }) => p.instagram_business_account);
}

async function batchIgInsights(mediaIds: string[]) {
  const batch = mediaIds.map((id) => ({
    method: "GET",
    relative_url: `${id}/insights?metric=reach,impressions,engagement,saved`,
  }));

  const body = new URLSearchParams({
    access_token: TOKEN!,
    batch: JSON.stringify(batch),
  });

  const res = await fetch("https://graph.facebook.com/v19.0", {
    method: "POST",
    body,
    next: { revalidate: 900 },
  });

  if (!res.ok) return mediaIds.map(() => null);
  const results = await res.json() as ({ code: number; body: string } | null)[];

  return results.map((result) => {
    if (!result || result.code !== 200) return null;
    try {
      const data = JSON.parse(result.body);
      const getVal = (name: string): number => {
        const item = (data.data ?? []).find((d: InsightItem) => d.name === name);
        const val = item?.values?.[0]?.value;
        if (val == null) return 0;
        if (typeof val === "object") return Object.values(val as Record<string, number>).reduce((a, b) => a + b, 0);
        return val as number;
      };
      return { reach: getVal("reach"), impressions: getVal("impressions"), engagement: getVal("engagement"), saved: getVal("saved") };
    } catch { return null; }
  });
}

type RawIgMedia = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  comments_count: number;
};

export async function getIgPosts(igUserId: string, datePreset: string): Promise<PagePost[]> {
  const { since, until } = getDateRange(datePreset);
  const fields = "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count";
  const url = `${BASE_URL}/${igUserId}/media?fields=${fields}&since=${since}&until=${until}&limit=10&access_token=${TOKEN}`;

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Meta API error: ${res.status}`);
  }
  const data = await res.json();
  const media: RawIgMedia[] = data.data ?? [];

  if (media.length === 0) return [];

  const insightsList = await batchIgInsights(media.map((m) => m.id));

  return media.map((m, i): PagePost => {
    const ins = insightsList[i];
    const reach = ins?.reach ?? 0;
    const engagement = ins?.engagement ?? (m.like_count + m.comments_count);
    return {
      id: m.id,
      message: m.caption,
      created_time: m.timestamp,
      full_picture: m.thumbnail_url ?? m.media_url,
      permalink_url: m.permalink,
      impressions: ins?.impressions ?? 0,
      impressions_paid: 0,
      reach,
      engaged_users: engagement,
      reactions: m.like_count,
      comments: m.comments_count,
      shares: 0,
      clicks: 0,
      saves: ins?.saved ?? 0,
      engagement_rate: reach > 0 ? (engagement / reach) * 100 : 0,
      source: "instagram",
    };
  });
}

const ZERO_INSIGHTS = {
  impressions: 0,
  impressions_paid: 0,
  reach: 0,
  engaged_users: 0,
  reactions: 0,
  clicks: 0,
  engagement_rate: 0,
};

type RawPost = {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
};

export async function getPagePosts(pageId: string, datePreset: string): Promise<PagePost[]> {
  const { since, until } = getDateRange(datePreset);

  const url = `${BASE_URL}/${pageId}/posts?fields=id,message,story,created_time,full_picture,permalink_url,shares,comments.summary(true)&since=${since}&until=${until}&limit=10&access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Meta API error: ${res.status}`);
  }
  const data = await res.json();
  const posts: RawPost[] = data.data ?? [];

  if (posts.length === 0) return [];

  const insightsList = await batchPostInsights(posts.map((p) => p.id), TOKEN!);

  return posts.map((post, i): PagePost => ({
    id: post.id,
    message: post.message,
    story: post.story,
    created_time: post.created_time,
    full_picture: post.full_picture,
    permalink_url: post.permalink_url,
    comments: post.comments?.summary?.total_count ?? 0,
    shares: post.shares?.count ?? 0,
    ...(insightsList[i] ?? ZERO_INSIGHTS),
  }));
}
