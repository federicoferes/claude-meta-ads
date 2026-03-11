import { NextResponse } from "next/server";
import { getCreativeInsights } from "@/lib/meta";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const datePreset = searchParams.get("datePreset") ?? "last_30d";

  if (!accountId) {
    return NextResponse.json({ error: "accountId requerido" }, { status: 400 });
  }

  try {
    const insights = await getCreativeInsights(accountId, datePreset);
    return NextResponse.json(insights);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
