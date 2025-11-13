import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SOCIAL_OFFER_ID = "SOCIALS";
const SOCIAL_POINTS = 1;

const formatPoints = (value: unknown) =>
  Number.parseFloat(Number(value ?? 0).toFixed(2));

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.offerLead.findFirst({
    where: { userId, offerId: SOCIAL_OFFER_ID },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Bonus already claimed." },
      { status: 409 }
    );
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.offerLead.create({
        data: {
          externalId: `social-${randomUUID()}`,
          offerId: SOCIAL_OFFER_ID,
          userId,
          points: SOCIAL_POINTS,
          status: "AVAILABLE",
          availableAt: now,
          awardedAt: now,
          raw: JSON.stringify({ source: "socials-bonus" }),
        },
        select: {
          id: true,
          offerId: true,
          points: true,
          status: true,
          createdAt: true,
          availableAt: true,
          awardedAt: true,
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: SOCIAL_POINTS },
        },
        select: {
          balance: true,
          pending: true,
        },
      });

      return { lead, user };
    });

    return NextResponse.json({
      message: "Social bonus granted.",
      balance: formatPoints(result.user.balance),
      pending: formatPoints(result.user.pending),
      lead: {
        id: result.lead.id,
        offerId: result.lead.offerId,
        points: formatPoints(result.lead.points),
        status: result.lead.status,
        createdAt: result.lead.createdAt,
        availableAt: result.lead.availableAt,
        awardedAt: result.lead.awardedAt,
      },
    });
  } catch (error) {
    console.error("Social bonus error", error);
    return NextResponse.json(
      { error: "Unable to grant social bonus right now." },
      { status: 500 }
    );
  }
}

