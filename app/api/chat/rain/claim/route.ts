import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authCookieOptions, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  await prisma.rainEvent.updateMany({
    where: { isActive: true, expiresAt: { lte: now } },
    data: { isActive: false },
  });

  const [user, rain] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.rainEvent.findFirst({
      where: { isActive: true, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!rain) {
    return NextResponse.json(
      { error: "No active rain to claim." },
      { status: 404 }
    );
  }

  const existingClaim = await prisma.rainClaim.findUnique({
    where: { rainId_userId: { rainId: rain.id, userId } },
  });

  if (existingClaim) {
    return NextResponse.json(
      { error: "You already claimed this rain." },
      { status: 409 }
    );
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.rainClaim.create({
      data: {
        rainId: rain.id,
        userId,
      },
    });

    return tx.user.update({
      where: { id: userId },
      data: {
        balance: { increment: rain.amount },
      },
      select: { balance: true },
    });
  });

  return NextResponse.json({
    claimed: rain.amount,
    balance: updatedUser.balance,
  });
}
