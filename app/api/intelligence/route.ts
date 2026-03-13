import { NextResponse } from "next/server";
import { getCreativeInsights, getAdThumbnails, calcROAS, calcCPA } from "@/lib/meta";
import { getPagePosts } from "@/lib/pages";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const pageId = searchParams.get("pageId");
  const datePreset = searchParams.get("datePreset") ?? "last_30d";

  if (!accountId || !pageId) {
    return NextResponse.json({ error: "accountId y pageId son requeridos" }, { status: 400 });
  }

  try {
    const [insights, thumbnails, posts] = await Promise.all([
      getCreativeInsights(accountId, datePreset),
      getAdThumbnails(accountId),
      getPagePosts(pageId, datePreset),
    ]);

    // Best ad: ROAS > 0 first, tiebreak by CTR
    const bestAd = [...insights]
      .map((ad) => ({ ...ad, roas: calcROAS(ad), cpa: calcCPA(ad), thumbnail: thumbnails[ad.ad_id] ?? null }))
      .sort((a, b) => {
        if (a.roas > 0 && b.roas > 0) return b.roas - a.roas;
        if (a.roas > 0) return -1;
        if (b.roas > 0) return 1;
        return parseFloat(b.ctr) - parseFloat(a.ctr);
      })[0] ?? null;

    // Best post: highest engagement rate
    const bestPost = [...posts].sort((a, b) => b.engagement_rate - a.engagement_rate)[0] ?? null;

    return NextResponse.json({ bestAd, bestPost });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
