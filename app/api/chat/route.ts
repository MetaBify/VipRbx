import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE_LENGTH = 230;
const MAX_STORED_MESSAGES = 20;
const WINDOW_MESSAGES = 20;

const urlPattern = /(https?:\/\/|www\.)/i;
const fancyCharPattern =
  /[\u2460-\u24FF\u2500-\u2BFF\u1D00-\u1D7F\u1D400-\u1D7FF\uFF00-\uFFEF]/u;

const bannedWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "slut",
  "dick",
  "cunt",
  "nigga",
  "nigger",
  "whore",
  "fag",
  "bastard",
  "motherfucker",
  "retard",
];

const normalizeContent = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const computeLevel = (balance: number, pending: number) =>
  Math.max(1, Math.floor((balance + pending) / 100) + 1);

export async function GET() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: WINDOW_MESSAGES,
    include: {
      user: { select: { username: true, id: true, isAdmin: true } },
    },
  });

  return NextResponse.json(
    messages.reverse().map((message) => ({
      id: message.id,
      content: message.content,
      level: message.level,
      createdAt: message.createdAt,
      username: message.user.username,
      userId: message.user.id,
      isAdmin: message.user.isAdmin,
    }))
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { content?: string } = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = (payload.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (urlPattern.test(content)) {
    return NextResponse.json(
      { error: "Links are not allowed in chat." },
      { status: 400 }
    );
  }

  if (fancyCharPattern.test(content)) {
    return NextResponse.json(
      { error: "Unsupported characters detected. Use standard text or emoji." },
      { status: 400 }
    );
  }

  const normalized = normalizeContent(content);
  if (bannedWords.some((word) => normalized.includes(word))) {
    return NextResponse.json(
      { error: "Watch the language. Message rejected." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      balance: true,
      pending: true,
      chatMutedUntil: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.chatMutedUntil && user.chatMutedUntil > new Date()) {
    return NextResponse.json(
      {
        error: `You are muted until ${user.chatMutedUntil.toLocaleString()}.`,
      },
      { status: 403 }
    );
  }

  const level = computeLevel(Number(user.balance), Number(user.pending));

  const message = await prisma.chatMessage.create({
    data: {
      content,
      userId: user.id,
      level,
    },
    include: {
      user: { select: { username: true, id: true, isAdmin: true } },
    },
  });

  // Trim stored chat history to the latest MAX_STORED_MESSAGES
  const overflow = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    skip: MAX_STORED_MESSAGES,
    select: { id: true },
  });

  if (overflow.length) {
    await prisma.chatMessage.deleteMany({
      where: { id: { in: overflow.map((item) => item.id) } },
    });
  }

  return NextResponse.json(
    {
      id: message.id,
      content: message.content,
      level: message.level,
      createdAt: message.createdAt,
      username: message.user.username,
      userId: message.user.id,
      isAdmin: message.user.isAdmin,
    },
    { status: 201 }
  );
}
