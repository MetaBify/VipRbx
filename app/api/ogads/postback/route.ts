import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const postbackKey = process.env.OGADS_POSTBACK_KEY;

const parseAmount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeStatus = (value: string | null) =>
  value ? value.toLowerCase() : "";

export async function GET(req: NextRequest) {
  if (!postbackKey) {
    return NextResponse.json(
      { error: "OGAds postback key not configured." },
      { status: 500 }
    );
  }

  const params = req.nextUrl.searchParams;
  const providedKey = params.get("key");

  if (!providedKey || providedKey !== postbackKey) {
    return NextResponse.json(
      { error: "Unauthorized postback request." },
      { status: 401 }
    );
  }

  const userId =
    params.get("aff_sub4") ??
    params.get("aff_sub") ??
    params.get("s1") ??
    undefined;

  if (!userId) {
    return NextResponse.json(
      { error: "Missing user identifier (aff_sub4)." },
      { status: 400 }
    );
  }

  const payout =
    parseAmount(params.get("payout")) ??
    parseAmount(params.get("amount")) ??
    0;

  if (!payout || payout <= 0) {
    return NextResponse.json(
      { error: "Invalid payout amount." },
      { status: 400 }
    );
  }

  const offerId =
    params.get("offer_id") ??
    params.get("offerid") ??
    params.get("id") ??
    "ogads";

  const timestamp =
    params.get("session_timestamp") ??
    params.get("datetime") ??
    params.get("date") ??
    "";
  const externalId = params.get("transaction_id")
    ? `ogads-${params.get("transaction_id")}`
    : `ogads-${offerId}-${timestamp || crypto.randomUUID()}`;

  const statusHint = normalizeStatus(params.get("status"));
  const isChargeback =
    statusHint.includes("chargeback") ||
    statusHint.includes("reject") ||
    statusHint.includes("reversed") ||
    params.get("chargeback") === "1" ||
    params.get("is_chargeback") === "1";

  const points = Number(payout.toFixed(2));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, pending: true },
      });

      if (!account) {
        return {
          status: 404,
          body: { error: "User not found." },
        };
      }

      const now = new Date();

      if (!isChargeback) {
        const placeholder = await tx.offerLead.findFirst({
          where: { userId, offerId, status: "CHECKING" },
          orderBy: { createdAt: "desc" },
        });

        const pendingRelease = placeholder?.points ?? 0;
        const pendingAdjustment = pendingRelease
          ? Math.min(pendingRelease, account.pending)
          : 0;

        const leadRecord = placeholder
          ? await tx.offerLead.update({
              where: { id: placeholder.id },
              data: {
                externalId,
                points,
                status: "AVAILABLE",
                availableAt: now,
                awardedAt: now,
                raw: JSON.stringify(Object.fromEntries(params.entries())),
              },
            })
          : await tx.offerLead.upsert({
              where: { externalId },
              update: {
                points,
                status: "AVAILABLE",
                availableAt: now,
                awardedAt: now,
                raw: JSON.stringify(Object.fromEntries(params.entries())),
              },
              create: {
                externalId,
                offerId,
                userId,
                points,
                status: "AVAILABLE",
                availableAt: now,
                awardedAt: now,
                raw: JSON.stringify(Object.fromEntries(params.entries())),
              },
            });

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            balance: { increment: points },
            ...(pendingAdjustment
              ? { pending: { decrement: pendingAdjustment } }
              : {}),
          },
          select: { balance: true, pending: true },
        });

        return {
          status: 200,
          body: {
            action: "reward",
            leadId: leadRecord.id,
            balance: updatedUser.balance,
            pending: updatedUser.pending,
          },
        };
      }

      const leadRecord = await tx.offerLead.upsert({
        where: { externalId },
        update: {
          status: "FAILED",
          raw: JSON.stringify(Object.fromEntries(params.entries())),
        },
        create: {
          externalId,
          offerId,
          userId,
          points,
          status: "FAILED",
          availableAt: now,
          raw: JSON.stringify(Object.fromEntries(params.entries())),
        },
      });

      const balanceAdjustment = Math.min(points, account.balance);

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: balanceAdjustment },
        },
        select: { balance: true, pending: true },
      });

      return {
        status: 200,
        body: {
          action: "chargeback",
          leadId: leadRecord.id,
          balance: updatedUser.balance,
          pending: updatedUser.pending,
        },
      };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("OGAds postback error", error);
    return NextResponse.json(
      { error: "Failed to process OGAds postback." },
      { status: 500 }
    );
  }
}

