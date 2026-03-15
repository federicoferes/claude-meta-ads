import { NextResponse } from "next/server";
import { getIgAccounts } from "@/lib/pages";

export async function GET() {
  try {
    const accounts = await getIgAccounts();
    return NextResponse.json(accounts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
