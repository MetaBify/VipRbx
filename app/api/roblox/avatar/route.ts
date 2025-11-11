import { NextRequest, NextResponse } from "next/server";

const HEADSHOT_BASE =
  "https://thumbnails.roblox.com/v1/users/avatar-headshot";
const LOOKUP_URL = "https://users.roblox.com/v1/usernames/users";

export async function POST(req: NextRequest) {
  let payload: { username?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = payload.username?.trim();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const lookupResponse = await fetch(LOOKUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      cache: "no-store",
    });

    if (!lookupResponse.ok) {
      const status = lookupResponse.status;
      return NextResponse.json(
        { error: "Roblox lookup failed" },
        { status }
      );
    }

    const lookupData = await lookupResponse.json();
    const userId = lookupData?.data?.[0]?.id;
    if (!userId) {
      return NextResponse.json({ avatarUrl: null });
    }

    const thumbUrl = `${HEADSHOT_BASE}?userIds=${userId}&size=150x150&format=Png&isCircular=false`;
    const thumbResponse = await fetch(thumbUrl, { cache: "no-store" });

    if (!thumbResponse.ok) {
      const status = thumbResponse.status;
      return NextResponse.json(
        { error: "Avatar fetch failed" },
        { status }
      );
    }

    const thumbData = await thumbResponse.json();
    const imageUrl = thumbData?.data?.[0]?.imageUrl ?? null;

    return NextResponse.json({ avatarUrl: imageUrl });
  } catch (error) {
    console.error("Roblox avatar proxy failed", error);
    return NextResponse.json(
      { error: "Failed to fetch Roblox avatar" },
      { status: 502 }
    );
  }
}
