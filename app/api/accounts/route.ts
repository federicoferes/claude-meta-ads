import { NextResponse } from "next/server";
import { getAdAccounts } from "@/lib/meta";

export async function GET() {
  try {
    const accounts = await getAdAccounts();
    return NextResponse.json(accounts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
