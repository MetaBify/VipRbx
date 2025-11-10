import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Payload =
  | { action: "delete"; messageId: string }
  | { action: "timeout"; userId: string; minutes?: number };

const MAX_TIMEOUT_MINUTES = 1440; // 24 hours

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });

  if (!actor?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

    const timeoutMinutes = Math.min(
      MAX_TIMEOUT_MINUTES,
      Math.max(1, Number(payload.minutes ?? 60))
    );

    const mutedUntil = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { chatMutedUntil: mutedUntil },
    });

    return NextResponse.json({
      status: "muted",
      mutedUntil,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
