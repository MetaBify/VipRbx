import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SIGNUP_BONUS_POINTS = 5;
const SOCIAL_OFFER_IDS = [
  "SOCIALS_YOUTUBE",
  "SOCIALS_ROBLOX",
  "SOCIALS_INSTAGRAM",
  "SOCIALS_TIKTOK",
];

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;

  const userId = verifyToken(token);
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const now = new Date();

  const expiredChecking = await prisma.offerLead.findMany({
    where: {
      userId,
      status: "CHECKING",
      availableAt: { lte: now },
    },
    select: { id: true, points: true },
  });

  if (expiredChecking.length) {
    const expiredIds = expiredChecking.map((lead) => lead.id);
    const expiredPoints = expiredChecking.reduce(
      (total, lead) => total + Number(lead.points),
      0
    );

    await prisma.$transaction([
      prisma.offerLead.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "FAILED" },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          pending: { decrement: expiredPoints },
        },
      }),
    ]);
  }

  const maturedLeads = await prisma.offerLead.findMany({
    where: {
      userId,
      status: "PENDING",
      availableAt: { lte: now },
    },
    select: { id: true, points: true },
  });

  if (maturedLeads.length) {
    const leadIds = maturedLeads.map((lead) => lead.id);
    const credit = maturedLeads.reduce(
      (total, lead) => total + Number(lead.points),
      0
    );

    await prisma.$transaction([
      prisma.offerLead.updateMany({
        where: { id: { in: leadIds } },
        data: { status: "AVAILABLE", awardedAt: now },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: credit },
          pending: { decrement: credit },
        },
      }),
    ]);
  }

  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  let bonusJustGranted = false;

  if (!user.signupBonusAwarded) {
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: SIGNUP_BONUS_POINTS },
        signupBonusAwarded: true,
      },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    bonusJustGranted = true;
  }

  const formatPoints = (value: unknown) =>
    Number.parseFloat(Number(value ?? 0).toFixed(2));

  const leads = user.leads.map((lead) => ({
    id: lead.id,
    offerId: lead.offerId,
    points: formatPoints(lead.points),
    status: lead.status,
    availableAt: lead.availableAt,
    createdAt: lead.createdAt,
    awardedAt: lead.awardedAt,
  }));

  const balancePoints = formatPoints(user.balance);
  const pendingPoints = Math.max(0, formatPoints(user.pending));

  const availablePoints = leads
    .filter((lead) => lead.status === "AVAILABLE")
    .reduce((total, lead) => total + lead.points, 0);
  const level = Math.max(
    1,
    Math.floor((balancePoints + pendingPoints) / 100) + 1
  );

  const socialLeads = await prisma.offerLead.findMany({
    where: {
      userId,
      offerId: { in: SOCIAL_OFFER_IDS },
    },
    select: { offerId: true },
  });

  const socialClaims = Array.from(
    new Set(socialLeads.map((lead) => lead.offerId))
  );

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: balancePoints,
      pending: pendingPoints,
      availablePoints: formatPoints(availablePoints),
      totalPoints: formatPoints(balancePoints + pendingPoints),
      level,
      isAdmin: user.isAdmin,
      chatMutedUntil: user.chatMutedUntil,
      signupBonusAwarded: user.signupBonusAwarded,
      leads,
      socialClaims,
    },
    bonusJustGranted,
  });
}
