import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Payload =
  | { action: "delete"; messageId: string }
  | { action: "timeout"; userId: string; minutes?: number; reason?: string }
  | { action: "untimeout"; userId: string };

const MAX_TIMEOUT_MINUTES = 1440; // 24 hours
const MAX_REASON_LENGTH = 200;

type AdminAuthResult =
  | { response: NextResponse }
  | { actor: { id: string; isAdmin: boolean } };

async function authorizeAdmin(req: NextRequest): Promise<AdminAuthResult> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });

  if (!actor?.isAdmin) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { actor };
}

export async function GET(req: NextRequest) {
  const authResult = await authorizeAdmin(req);
  if ("response" in authResult) {
    return authResult.response;
  }
  const { actor } = authResult;

  const now = new Date();
  const muted = await prisma.user.findMany({
    where: { chatMutedUntil: { gt: now } },
    select: { id: true, username: true, chatMutedUntil: true },
    orderBy: { chatMutedUntil: "desc" },
  });

  return NextResponse.json({
    muted: muted.map((user) => ({
      id: user.id,
      username: user.username,
      mutedUntil: user.chatMutedUntil,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeAdmin(req);
  if ("response" in authResult) {
    return authResult.response;
  }
  const { actor } = authResult;

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.action === "delete") {
    if (!payload.messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }
    await prisma.chatMessage.delete({
      where: { id: payload.messageId },
    });
    return NextResponse.json({ status: "deleted" });
  }

  if (payload.action === "timeout") {
    if (!payload.userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const reason = (payload.reason ?? "").slice(0, MAX_REASON_LENGTH).trim();
    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required for timeouts." },
        { status: 400 }
      );
    }

    const timeoutMinutes = Math.min(
      MAX_TIMEOUT_MINUTES,
      Math.max(1, Number(payload.minutes ?? 60))
    );

    const mutedUntil = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    const [target, actorUser] = await Promise.all([
      prisma.user.update({
        where: { id: payload.userId },
        data: { chatMutedUntil: mutedUntil },
        select: { username: true },
      }),
      prisma.user.findUnique({
        where: { id: actor.id },
        select: { balance: true, pending: true, username: true },
      }),
    ]);

    const actorLevel = actorUser
      ? Math.max(
          1,
          Math.floor(
            (Number(actorUser.balance) + Number(actorUser.pending)) / 100
          ) + 1
        )
      : 1;
    const actorName = actorUser?.username ?? "Admin";

    await prisma.chatMessage.create({
      data: {
        content: `🔇 ${target.username} was muted by ${actorName} for ${timeoutMinutes} min — ${reason}`,
        userId: actor.id,
        level: actorLevel,
      },
    });

    return NextResponse.json({
      status: "muted",
      mutedUntil,
    });
  }

  if (payload.action === "untimeout") {
    if (!payload.userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const [target, actorUser] = await Promise.all([
      prisma.user.update({
        where: { id: payload.userId },
        data: { chatMutedUntil: null },
        select: { username: true },
      }),
      prisma.user.findUnique({
        where: { id: actor.id },
        select: { balance: true, pending: true, username: true },
      }),
    ]);

    const actorLevel = actorUser
      ? Math.max(
          1,
          Math.floor(
            (Number(actorUser.balance) + Number(actorUser.pending)) / 100
          ) + 1
        )
      : 1;
    const actorName = actorUser?.username ?? "Admin";

    await prisma.chatMessage.create({
      data: {
        content: `✅ ${actorName} lifted the mute for ${target.username}.`,
        userId: actor.id,
        level: actorLevel,
      },
    });

    return NextResponse.json({ status: "unmuted" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
