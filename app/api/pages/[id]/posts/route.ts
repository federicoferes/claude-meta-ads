import { NextResponse } from "next/server";
import { getPagePosts } from "@/lib/pages";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const datePreset = searchParams.get("datePreset") ?? "last_30d";

  try {
    const posts = await getPagePosts(params.id, datePreset);
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
