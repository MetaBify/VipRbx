import jwt, { JwtPayload } from "jsonwebtoken";

const TOKEN_COOKIE = "viprbx_token";
const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env variable is not set");
  }
  return secret;
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, getAuthSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getAuthSecret()) as JwtPayload;
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

export const authCookieOptions = {
  name: TOKEN_COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_IN_SECONDS,
  },
};
