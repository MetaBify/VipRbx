import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";

const defaultFeedUrl = "https://taprain.com/api/templates/feed";
const feedUrl = process.env.TAPRAIN_FEED_URL ?? defaultFeedUrl;
const tapRainApiKey = process.env.TAPRAIN_API_KEY;
const tapRainS2 = process.env.TAPRAIN_S2;

const buildFeedUrl = (
  req: NextRequest,
  userId: string,
  ip: string,
  userAgent: string
) => {
  const url = new URL(feedUrl);
  url.searchParams.set("api_key", tapRainApiKey as string);
  url.searchParams.set("max", "10");
  url.searchParams.set("s1", userId);
  if (tapRainS2) {
    url.searchParams.set("s2", tapRainS2);
  }
  url.searchParams.set("ip", ip);
  url.searchParams.set("user_agent", userAgent);
  return url;
};

export async function GET(req: NextRequest) {
  if (!tapRainApiKey) {
    return NextResponse.json(
      { error: "TapRain feed not configured." },
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
    req.headers.get("cf-connecting-ip");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  const requestIp = (req as unknown as { ip?: string })?.ip;
  const clientIp = forwardedIp ?? requestIp ?? "0.0.0.0";
  const userAgent = req.headers.get("user-agent") ?? "Mozilla/5.0";

  try {
    const url = buildFeedUrl(req, userId, clientIp, userAgent);
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch TapRain offers.",
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("TapRain feed error", error);
    return NextResponse.json(
      { error: "TapRain feed not reachable." },
      { status: 502 }
    );
  }
}

