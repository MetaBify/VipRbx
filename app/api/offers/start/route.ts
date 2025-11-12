import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CHECK_WINDOW_MS = 48 * 60 * 60 * 1000;

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

  let payload: {
    offerId?: string;
    offerName?: string;
    points?: number;
  } = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const offerId = String(payload.offerId ?? "").trim();
  const offerName = payload.offerName ? String(payload.offerName) : null;
  const points = Number(payload.points);

  if (!offerId) {
    return NextResponse.json(
      { error: "offerId is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(points) || points <= 0) {
    return NextResponse.json(
      { error: "points must be a positive number." },
      { status: 400 }
    );
  }

  const normalizedPoints = Number(points.toFixed(2));
  const availableAt = new Date(Date.now() + CHECK_WINDOW_MS);
  const placeholderExternalId = `start_${randomUUID()}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.offerLead.create({
        data: {
          externalId: placeholderExternalId,
          offerId,
          points: normalizedPoints,
          status: "CHECKING",
          availableAt,
          userId,
          raw: JSON.stringify({
            source: "manual-start",
            offerName,
          }),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          pending: { increment: normalizedPoints },
        },
        select: {
          pending: true,
          balance: true,
        },
      });

      return {
        lead,
        pending: Number(updatedUser.pending.toFixed(2)),
        balance: Number(updatedUser.balance.toFixed(2)),
      };
    });

    return NextResponse.json({
      lead: {
        id: result.lead.id,
        offerId,
        points: normalizedPoints,
        status: "CHECKING",
        availableAt: result.lead.availableAt.toISOString(),
        createdAt: result.lead.createdAt.toISOString(),
        awardedAt: result.lead.awardedAt
          ? result.lead.awardedAt.toISOString()
          : null,
      },
      pending: result.pending,
      totalPoints: Number((result.balance + result.pending).toFixed(2)),
      level: computeLevel(result.balance, result.pending),
    });
  } catch (error) {
    console.error("Offer start error", error);
    return NextResponse.json(
      { error: "Unable to start offer right now." },
      { status: 500 }
    );
  }
}
