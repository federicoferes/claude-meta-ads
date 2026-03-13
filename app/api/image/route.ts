import { NextResponse } from "next/server";

const ALLOWED_DOMAINS = ["fbcdn.net", "fbsbx.com", "facebook.com", "cdninstagram.com", "lookaside.facebook.com"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return new NextResponse("Missing url", { status: 400 });

  const isAllowed = ALLOWED_DOMAINS.some((d) => url.includes(d));
  if (!isAllowed) return new NextResponse("Domain not allowed", { status: 403 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MetaAdsBot/1.0)" },
    });
    if (!res.ok) return new NextResponse("Image fetch failed", { status: res.status });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("Image fetch failed", { status: 500 });
  }
}
