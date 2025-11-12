import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";

const DEFAULT_BITLABS_URL =
  "https://api.bitlabs.ai/v1/client/user/offers" as const;

const bitLabsUrl = process.env.BITLABS_API_URL ?? DEFAULT_BITLABS_URL;
const bitLabsToken = process.env.BITLABS_API_TOKEN;
const bitLabsWallCode = process.env.BITLABS_WALL_CODE;

const buildQuery = (
  req: NextRequest,
  userId: string,
  wallCode: string
): URL => {
  const url = new URL(bitLabsUrl);
  url.searchParams.set("wall_code", wallCode);
  url.searchParams.set("user_id", userId);

  const forwardedFor =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    undefined;
  const clientIp = forwardedFor?.split(",")[0].trim();
  if (clientIp) {
    url.searchParams.set("ip", clientIp);
  }

  const userAgent = req.headers.get("user-agent");
  if (userAgent) {
    url.searchParams.set("user_agent", userAgent);
  }

  const country =
    (req as unknown as { geo?: { country?: string } })?.geo?.country ??
    req.headers.get("cf-ipcountry") ??
    "";
  if (country) {
    url.searchParams.set("country", country);
  }

  return url;
};

export async function GET(req: NextRequest) {
  if (!bitLabsToken || !bitLabsWallCode) {
    return NextResponse.json(
      {
        error:
          "BitLabs feed missing configuration. Set BITLABS_API_TOKEN and BITLABS_WALL_CODE.",
      },
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

  const url = buildQuery(req, userId, bitLabsWallCode);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Api-Token": bitLabsToken,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch BitLabs offers.",
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("BitLabs feed error", error);
    return NextResponse.json(
      { error: "BitLabs feed not reachable." },
      { status: 502 }
    );
  }
}
