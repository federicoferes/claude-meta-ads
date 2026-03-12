import { NextResponse } from "next/server";
import { getCreativeInsights, getPreviousCreativeInsights } from "@/lib/meta";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const datePreset = searchParams.get("datePreset") ?? "last_30d";

  if (!accountId) {
    return NextResponse.json({ error: "accountId requerido" }, { status: 400 });
  }

  try {
    const [current, previous] = await Promise.all([
      getCreativeInsights(accountId, datePreset),
      getPreviousCreativeInsights(accountId, datePreset),
    ]);
    return NextResponse.json({ current, previous });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
