import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";

const defaultFeedUrl =
  "https://www.cpagrip.com/common/offer_feed_json.php";
const cpagripFeedUrl = process.env.CPAGRIP_FEED_URL ?? defaultFeedUrl;
const cpagripUserId = process.env.CPAGRIP_USER_ID;
const cpagripKey = process.env.CPAGRIP_PRIVATE_KEY;
const cpagripDomain = process.env.CPAGRIP_TRACKING_DOMAIN;

const buildFeedUrl = (
  userId: string,
  ip: string,
  userAgent: string,
  country?: string | null
): URL => {
  const url = new URL(cpagripFeedUrl);
  url.searchParams.set("user_id", cpagripUserId as string);
  url.searchParams.set("key", cpagripKey as string);
  url.searchParams.set("tracking_id", userId);
  url.searchParams.set("limit", "10");
  if (cpagripDomain) {
    url.searchParams.set("domain", cpagripDomain);
  }
  if (country) {
    url.searchParams.set("country", country);
  }
  url.searchParams.set("ip", ip);
  url.searchParams.set("ua", userAgent);
  return url;
};

export async function GET(req: NextRequest) {
  if (!cpagripUserId || !cpagripKey) {
    return NextResponse.json(
      { error: "CPA Grip feed not configured." },
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
  const countryHeader =
    req.headers.get("x-vercel-ip-country") ??
    (req as unknown as { geo?: { country?: string } })?.geo?.country ??
    null;

  try {
    const url = buildFeedUrl(userId, clientIp, userAgent, countryHeader);
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch CPA Grip offers.",
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    try {
      const payload = JSON.parse(text);
      return NextResponse.json(payload);
    } catch {
      return NextResponse.json(
        {
          error: "CPA Grip feed returned invalid JSON.",
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("CPA Grip feed error", error);
    return NextResponse.json(
      { error: "CPA Grip feed not reachable." },
      { status: 502 }
    );
  }
}
