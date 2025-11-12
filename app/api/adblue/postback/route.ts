import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const postbackKey = process.env.ADBLUE_POSTBACK_KEY;

const parseNumber = (value: unknown): number | null => {
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
  value ? value.trim().toLowerCase() : "1";

export async function GET(req: NextRequest) {
  if (!postbackKey) {
    return NextResponse.json(
      { error: "AdBlue postback key not configured." },
      { status: 500 }
    );
  }

  const params = req.nextUrl.searchParams;
  const providedKey = params.get("key");

  if (!providedKey || providedKey !== postbackKey) {
    return NextResponse.json(
      { error: "Unauthorized AdBlue postback request." },
      { status: 401 }
    );
  }

  const userId = params.get("s1") ?? params.get("sub1");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing s1 (user id) in AdBlue postback." },
      { status: 400 }
    );
  }

  const payout =
    parseNumber(params.get("payout")) ??
    (parseNumber(params.get("payout_cents")) ?? 0) / 100;

  if (!payout || payout <= 0) {
    return NextResponse.json(
      { error: "Invalid payout amount." },
      { status: 400 }
    );
  }

  const offerId = params.get("offer_id") ?? "adblue";
  const timestamp = params.get("unix") ?? params.get("timestamp") ?? "";
  const externalId =
    params.get("lead_id") ??
    params.get("click_id") ??
    params.get("conversion_id") ??
    `adblue-${offerId}-${timestamp || Date.now()}`;

  const statusHint = normalizeStatus(params.get("status"));
  const isReversal = statusHint === "0" || statusHint.includes("reversal");

  const points = Number(payout.toFixed(2));
  const rawPayload = JSON.stringify(Object.fromEntries(params.entries()));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, pending: true },
      });

      if (!account) {
        return {
          status: 404,
          body: { error: "User not found for AdBlue postback." },
        };
      }

      const now = new Date();

      if (!isReversal) {
        const placeholder = await tx.offerLead.findFirst({
          where: { userId, offerId, status: "CHECKING" },
          orderBy: { createdAt: "asc" },
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
                raw: rawPayload,
              },
            })
          : await tx.offerLead.upsert({
              where: { externalId },
              update: {
                points,
                status: "AVAILABLE",
                availableAt: now,
                awardedAt: now,
                raw: rawPayload,
              },
              create: {
                externalId,
                offerId,
                userId,
                points,
                status: "AVAILABLE",
                availableAt: now,
                awardedAt: now,
                raw: rawPayload,
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

      const existingLead = await tx.offerLead.findUnique({
        where: { externalId },
      });

      const leadRecord = existingLead
        ? await tx.offerLead.update({
            where: { id: existingLead.id },
            data: {
              status: "FAILED",
              raw: rawPayload,
            },
          })
        : await tx.offerLead.create({
            data: {
              externalId,
              offerId,
              userId,
              points,
              status: "FAILED",
              availableAt: now,
              raw: rawPayload,
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
          action: "reversal",
          leadId: leadRecord.id,
          balance: updatedUser.balance,
          pending: updatedUser.pending,
        },
      };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("AdBlue postback error", error);
    return NextResponse.json(
      { error: "Failed to process AdBlue postback." },
      { status: 500 }
    );
  }
}

