import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const checkUrl = process.env.OFFER_CHECK_URL;
const feedUserId = process.env.OFFER_FEED_USER_ID;
const feedApiKey = process.env.OFFER_FEED_API_KEY;
const CHECK_WINDOW_MS = 48 * 60 * 60 * 1000;

function parseLeadsPayload(payload: unknown): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    const jsonStart = trimmed.indexOf("(");
    const jsonEnd = trimmed.lastIndexOf(")");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const jsonLike = trimmed.slice(jsonStart + 1, jsonEnd);
        const parsed = JSON.parse(jsonLike);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }

  return [];
}

export async function POST(req: NextRequest) {
  if (!checkUrl || !feedUserId || !feedApiKey) {
    return NextResponse.json(
      { error: "Offer check endpoint not configured." },
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

  const url = new URL(checkUrl);
  url.searchParams.set(
    "testing",
    process.env.NODE_ENV === "development" ? "1" : "0"
  );
  url.searchParams.set("user_id", feedUserId);
  url.searchParams.set("api_key", feedApiKey);
  url.searchParams.set("s1", userId);
  url.searchParams.set("format", "json");

  try {
    const remoteResponse = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json,text/javascript",
      },
    });

    const textPayload = await remoteResponse.text();
    let leadsPayload: any;
    try {
      leadsPayload = JSON.parse(textPayload);
    } catch {
      leadsPayload = parseLeadsPayload(textPayload);
    }

    const leads = parseLeadsPayload(leadsPayload);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let pendingDelta = 0;

      for (const lead of leads) {
        const externalId = String(
          lead?.lead_id ??
            lead?.id ??
            `${lead?.offer_id ?? "offer"}-${
              lead?.timestamp ?? lead?.time ?? Date.now()
            }`
        );

        const offerId = String(lead?.offer_id ?? "unknown");
        const pointsCents = Number(lead?.points ?? 0);

        if (!externalId || Number.isNaN(pointsCents) || pointsCents <= 0) {
          continue;
        }

        const exists = await tx.offerLead.findUnique({
          where: { externalId },
          select: { id: true },
        });

        if (exists) {
          continue;
        }

        const pointAmount = Number((pointsCents / 100).toFixed(2));
        const availableAt = new Date(Date.now() + CHECK_WINDOW_MS);

        const placeholder = await tx.offerLead.findFirst({
          where: {
            userId,
            offerId,
            status: "CHECKING",
          },
          orderBy: { createdAt: "asc" },
        });

        if (placeholder) {
          const previousPoints = Number(placeholder.points);
          const pointsDiff = pointAmount - previousPoints;

        await tx.offerLead.update({
          where: { id: placeholder.id },
          data: {
            externalId,
            points: pointAmount,
            status: "PENDING",
            availableAt: new Date(),
            raw: JSON.stringify(lead),
          },
        });

          if (pointsDiff !== 0) {
            pendingDelta += pointsDiff;
          }
          continue;
        }

        await tx.offerLead.create({
          data: {
            externalId,
            offerId,
            points: pointAmount,
            status: "PENDING",
            availableAt: new Date(),
            userId,
            raw: JSON.stringify(lead),
          },
        });

        pendingDelta += pointAmount;
      }

      if (pendingDelta !== 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            pending: {
              increment: pendingDelta,
            },
          },
        });
      }

      const maturedLeads = await tx.offerLead.findMany({
        where: {
          userId,
          status: "PENDING",
          availableAt: { lte: now },
        },
        select: { id: true, points: true },
      });

      let balanceIncrement = 0;
      if (maturedLeads.length) {
        const leadIds = maturedLeads.map((lead) => lead.id);
        await tx.offerLead.updateMany({
          where: { id: { in: leadIds } },
          data: {
            status: "AVAILABLE",
            awardedAt: now,
          },
        });

        balanceIncrement = maturedLeads.reduce(
          (total, lead) => total + Number(lead.points),
          0
        );

        await tx.user.update({
          where: { id: userId },
          data: {
            balance: { increment: balanceIncrement },
            pending: { decrement: balanceIncrement },
          },
        });
      }

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        include: {
          leads: {
            orderBy: { createdAt: "desc" },
            take: 25,
          },
        },
      });

      return {
        user: updatedUser,
        pendingIncrement: pendingDelta,
        balanceIncrement,
      };
    });

    const formatPoints = (value: unknown) =>
      Number.parseFloat(Number(value ?? 0).toFixed(2));

    const leadsList =
      result.user?.leads.map((lead) => ({
        id: lead.id,
        offerId: lead.offerId,
        points: formatPoints(lead.points),
        status: lead.status,
        availableAt: lead.availableAt,
        awardedAt: lead.awardedAt,
        createdAt: lead.createdAt,
      })) ?? [];

    const balancePoints = formatPoints(result.user?.balance ?? 0);
    const pendingPoints = Math.max(0, formatPoints(result.user?.pending ?? 0));
    const availablePoints = leadsList
      .filter((lead) => lead.status === "AVAILABLE")
      .reduce((total, lead) => total + lead.points, 0);

    return NextResponse.json({
      balance: balancePoints,
      pending: pendingPoints,
      availablePoints: formatPoints(availablePoints),
      totalPoints: formatPoints(balancePoints + pendingPoints),
      newPending: result.pendingIncrement,
      newAvailable: result.balanceIncrement,
      leads: leadsList,
    });
  } catch (error) {
    console.error("Offer check error", error);
    return NextResponse.json(
      { error: "Unable to sync leads right now." },
      { status: 502 }
    );
  }
}
