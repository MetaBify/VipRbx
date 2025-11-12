import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";

const defaultOgAdsUrl = "https://applocked.org/api/v2";
const ogAdsUrl = process.env.OGADS_API_URL ?? defaultOgAdsUrl;
const ogAdsApiKey = process.env.OGADS_API_KEY;
const ogAdsCtype = process.env.OGADS_CTYPE;
const ogAdsAffiliateId = process.env.OGADS_AFFILIATE_ID;

const buildRequestUrl = (
  req: NextRequest,
  userId: string,
  clientIp: string | null,
  userAgent: string | null
) => {
  const url = new URL(ogAdsUrl);
  if (clientIp) {
    url.searchParams.set("ip", clientIp);
  }
  if (userAgent) {
    url.searchParams.set("user_agent", userAgent);
  }
  if (ogAdsCtype) {
    url.searchParams.set("ctype", ogAdsCtype);
  }
  if (ogAdsAffiliateId) {
    url.searchParams.set("aff_id", ogAdsAffiliateId);
  }
  url.searchParams.set("aff_sub4", userId);
  return url;
};

export async function GET(req: NextRequest) {
  if (!ogAdsApiKey) {
    return NextResponse.json(
      { error: "OGAds feed not configured." },
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

  const url = buildRequestUrl(req, userId, clientIp, userAgent);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${ogAdsApiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch OGAds offers.", details: text.slice(0, 400) },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OGAds feed error", error);
    return NextResponse.json(
      { error: "OGAds feed not reachable." },
      { status: 502 }
    );
  }
}
