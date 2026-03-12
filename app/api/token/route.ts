import { NextResponse } from "next/server";

const BASE_URL = "https://graph.facebook.com/v19.0";

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!token || !appId || !appSecret) {
    return NextResponse.json({ error: "Faltan variables de entorno (META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN)" }, { status: 500 });
  }

  const appToken = `${appId}|${appSecret}`;
  const url = `${BASE_URL}/debug_token?input_token=${token}&access_token=${appToken}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: `Meta API error: ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const tokenData = data.data;

  if (!tokenData?.is_valid) {
    return NextResponse.json({ valid: false, error: tokenData?.error?.message ?? "Token inválido o vencido" });
  }

  const expiresAt: number = tokenData.expires_at ?? 0;
  const daysLeft = expiresAt > 0
    ? Math.floor((expiresAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({ valid: true, expiresAt, daysLeft });
}

export async function POST() {
  const token = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!token || !appId || !appSecret) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 });
  }

  const url = `${BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { error?: { message?: string } }).error?.message ?? `Meta API error: ${res.status}` },
      { status: 500 }
    );
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const expiresInDays = Math.floor(data.expires_in / 86400);
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  return NextResponse.json({ token: data.access_token, expiresAt, expiresInDays });
}
