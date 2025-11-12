import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const bitLabsServerKey = process.env.BITLABS_SERVER_KEY;

const SIGNATURE_HEADER_CANDIDATES = [
  "x-signature",
  "bitlabs-signature",
  "x-bitlabs-signature",
  "x-hmac-signature",
];

const normalizeNumber = (value: unknown): number | null => {
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

const timingSafeEquals = (a: string, b: string) => {
  const bufferA = Buffer.from(a || "", "utf8");
  const bufferB = Buffer.from(b || "", "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
};

const extractSignature = (req: NextRequest): string | null => {
  for (const header of SIGNATURE_HEADER_CANDIDATES) {
    const value = req.headers.get(header);
    if (value) {
      return value.trim();
    }
  }
  return null;
};

const detectCallbackType = (payload: Record<string, unknown>): string => {
  const hint =
    payload.callback_type ??
    payload.event ??
    payload.type ??
    payload.status ??
    payload.state ??
    "";
  return hint ? String(hint).toLowerCase() : "";
};

const isReversalType = (hint: string) =>
  ["recon", "chargeback", "reverse", "deduct", "reject", "ban"].some((token) =>
    hint.includes(token)
  );

const parseBody = (rawBody: string, contentType: string | null) => {
  if (contentType?.includes("application/json")) {
    return rawBody ? JSON.parse(rawBody) : {};
  }

  const searchParams = new URLSearchParams(rawBody);
  return Array.from(searchParams.entries()).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {}
  );
};

export async function POST(req: NextRequest) {
  if (!bitLabsServerKey) {
    return NextResponse.json(
      { error: "BitLabs callback not configured." },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const signature = extractSignature(req);

  if (!signature) {
    return NextResponse.json(
      { error: "Missing BitLabs signature header." },
      { status: 401 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", bitLabsServerKey)
    .update(rawBody)
    .digest("hex");

  if (!timingSafeEquals(signature.toLowerCase(), expectedSignature)) {
    return NextResponse.json(
      { error: "Invalid BitLabs signature." },
      { status: 401 }
    );
  }

  let payload: Record<string, any>;
  try {
    payload = parseBody(rawBody, req.headers.get("content-type"));
  } catch (error) {
    console.error("BitLabs callback parse error", error);
    return NextResponse.json(
      { error: "Unable to parse BitLabs payload." },
      { status: 400 }
    );
  }

  const rawUserId =
    payload.user_id ??
    payload.userId ??
    payload.uid ??
    payload.s1 ??
    payload.sub_id ??
    payload.sub1;

  if (!rawUserId) {
    return NextResponse.json(
      { error: "Missing BitLabs user identifier." },
      { status: 400 }
    );
  }

  const userId = String(rawUserId);
  const offerId = String(
    payload.offer_id ??
      payload.offerId ??
      payload.campaign_id ??
      payload.funnel_id ??
      payload.product_id ??
      "bitlabs"
  );
  const externalId = String(
    payload.transaction_id ??
      payload.ticket_id ??
      payload.conversion_id ??
      payload.reward_id ??
      payload.id ??
      crypto.randomUUID()
  );

  const amount =
    normalizeNumber(payload.reward) ??
    normalizeNumber(payload.amount) ??
    normalizeNumber(payload.points) ??
    normalizeNumber(payload.payout) ??
    normalizeNumber(payload.value) ??
    0;

  const points = Number(amount.toFixed(2));
  const callbackHint = detectCallbackType(payload);
  const isReversal = isReversalType(callbackHint);
  const isReward = !isReversal;

  if (points <= 0 && isReward) {
    return NextResponse.json(
      { error: "BitLabs callback missing positive reward amount." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, pending: true },
      });

      if (!account) {
        return {
          status: 404,
          body: { error: "User not found for BitLabs callback." },
        };
      }

      const now = new Date();

      if (isReward) {
        const placeholder = await tx.offerLead.findFirst({
          where: { userId, offerId, status: "CHECKING" },
          orderBy: { createdAt: "desc" },
        });

        const pendingRelease = placeholder?.points ?? 0;
        const pendingAdjustment = pendingRelease
          ? Math.min(pendingRelease, account.pending)
          : 0;

        let leadRecord;
        if (placeholder) {
          leadRecord = await tx.offerLead.update({
            where: { id: placeholder.id },
            data: {
              externalId,
              points,
              status: "AVAILABLE",
              availableAt: now,
              awardedAt: now,
              raw: JSON.stringify(payload),
            },
          });
        } else {
          leadRecord = await tx.offerLead.upsert({
            where: { externalId },
            update: {
              points,
              status: "AVAILABLE",
              availableAt: now,
              awardedAt: now,
              raw: JSON.stringify(payload),
            },
            create: {
              externalId,
              offerId,
              userId,
              points,
              status: "AVAILABLE",
              availableAt: now,
              awardedAt: now,
              raw: JSON.stringify(payload),
            },
          });
        }

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
              raw: JSON.stringify(payload),
            },
          })
        : await tx.offerLead.create({
            data: {
              externalId,
              offerId,
              userId,
              points: points > 0 ? points : 0,
              status: "FAILED",
              availableAt: now,
              raw: JSON.stringify(payload),
            },
          });

      const debitAmount = points > 0 ? points : leadRecord.points ?? 0;
      const balanceAdjustment = Math.min(debitAmount, account.balance);

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
    console.error("BitLabs callback error", error);
    return NextResponse.json(
      { error: "Failed to process BitLabs callback." },
      { status: 500 }
    );
  }
}

