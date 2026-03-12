import { NextResponse } from "next/server";
import { getPages } from "@/lib/pages";

export async function GET() {
  try {
    const pages = await getPages();
    return NextResponse.json(pages);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
