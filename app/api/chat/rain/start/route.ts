import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_RAIN_AMOUNT = 5000;
const MIN_RAIN_DURATION = 1;
const MAX_RAIN_DURATION = 120;

const computeLevel = (balance: number, pending: number) =>
  Math.max(1, Math.floor((balance + pending) / 100) + 1);

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true, balance: true, pending: true, username: true },
  });

  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: { amount?: number; durationMinutes?: number } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Positive rain amount required." },
      { status: 400 }
    );
  }

  if (amount > MAX_RAIN_AMOUNT) {
    return NextResponse.json(
      { error: `Rain amount too high. Max ${MAX_RAIN_AMOUNT}.` },
      { status: 400 }
    );
  }

  const durationMinutes = Math.max(
    MIN_RAIN_DURATION,
    Math.min(
      MAX_RAIN_DURATION,
      Math.round(Number(payload.durationMinutes ?? 5))
    )
  );

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const rain = await prisma.$transaction(async (tx) => {
    await tx.rainEvent.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const createdRain = await tx.rainEvent.create({
      data: {
        amount,
        createdById: admin.id,
        isActive: true,
        durationMinutes,
        expiresAt,
      },
    });

    await tx.chatMessage.create({
      data: {
        content: `🌧️ Rain started by ${admin.username}! Claim ${amount} points each for the next ${durationMinutes} min.`,
        userId: admin.id,
        level: computeLevel(Number(admin.balance), Number(admin.pending)),
      },
    });

    return createdRain;
  });

  return NextResponse.json({
    rain: {
      id: rain.id,
      amount: rain.amount,
      createdAt: rain.createdAt,
      durationMinutes: rain.durationMinutes,
    },
  });
}
