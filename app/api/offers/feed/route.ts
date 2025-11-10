import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";

const feedUrl = process.env.OFFER_FEED_URL;
const feedUserId = process.env.OFFER_FEED_USER_ID;
const feedApiKey = process.env.OFFER_FEED_API_KEY;

export async function GET(req: NextRequest) {
  if (!feedUrl || !feedUserId || !feedApiKey) {
    return NextResponse.json(
      { error: "Offer feed not configured." },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forwardedFor =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "";
  const clientIp = forwardedFor.split(",")[0]?.trim();
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const url = new URL(feedUrl);
  url.searchParams.set("user_id", feedUserId);
  url.searchParams.set("api_key", feedApiKey);
  url.searchParams.set("limit", "10");
  url.searchParams.set("s1", userId);
  url.searchParams.set("s2", "");
  if (clientIp) {
    url.searchParams.set("ip", clientIp);
  }
  if (userAgent) {
    url.searchParams.set("user_agent", userAgent);
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch offers." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Offer feed error", error);
    return NextResponse.json(
      { error: "Offer feed not reachable." },
      { status: 502 }
    );
  }
}
