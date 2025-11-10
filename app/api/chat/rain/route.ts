import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authCookieOptions, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const viewerId = verifyToken(token);

  const rain = await prisma.rainEvent.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      createdBy: { select: { username: true } },
      _count: { select: { claims: true } },
    },
  });

  if (!rain) {
    return NextResponse.json({ rain: null });
  }

  let claimedByViewer = false;
  if (viewerId) {
    const claim = await prisma.rainClaim.findUnique({
      where: { rainId_userId: { rainId: rain.id, userId: viewerId } },
      select: { id: true },
    });
    claimedByViewer = Boolean(claim);
  }

  return NextResponse.json({
    rain: {
      id: rain.id,
      amount: rain.amount,
      createdAt: rain.createdAt,
      createdBy: rain.createdBy?.username ?? "Admin",
      claims: rain._count.claims,
      claimedByViewer,
    },
  });
}
