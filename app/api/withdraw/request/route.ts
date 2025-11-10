import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const optionCatalog: Record<
  string,
  { label: string; points: number; details: string }
> = {
  "giftcard-50": {
    label: "Robux gift card ($5 value) - 50 pts",
    points: 50,
    details: "Digital Robux code",
  },
  "giftcard-100": {
    label: "Robux gift card ($10 value) - 100 pts",
    points: 100,
    details: "Digital Robux code",
  },
  "paypal-120": {
    label: "PayPal transfer ($10 value) - 120 pts",
    points: 120,
    details: "PayPal USD transfer",
  },
};

export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return NextResponse.json(
      { error: "Withdrawal service is not configured." },
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

  let body: { optionId?: string; note?: string } = {};

  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const optionId = body.optionId?.trim();
  const note = body.note?.trim() ?? "";

  if (!optionId || !optionCatalog[optionId]) {
    return NextResponse.json(
      { error: "Unknown withdrawal option." },
      { status: 400 }
    );
  }

  const selectedOption = optionCatalog[optionId];

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (
    selectedOption.points > 0 &&
    Number(user.balance) < selectedOption.points
  ) {
    return NextResponse.json(
      { error: "Insufficient points for this reward." },
      { status: 400 }
    );
  }

  const balanceBefore = Number(user.balance);
  let updatedUser = user;

  if (selectedOption.points > 0) {
    try {
      updatedUser = await prisma.$transaction(async (tx) => {
        const affected = await tx.user.updateMany({
          where: {
            id: userId,
            balance: { gte: selectedOption.points },
          },
          data: {
            balance: { decrement: selectedOption.points },
          },
        });

        if (affected.count === 0) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        const freshUser = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!freshUser) {
          throw new Error("USER_NOT_FOUND");
        }

        return freshUser;
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INSUFFICIENT_BALANCE"
      ) {
        return NextResponse.json(
          { error: "Insufficient points for this reward." },
          { status: 400 }
        );
      }

      console.error("Failed to deduct points for withdrawal:", error);
      return NextResponse.json(
        { error: "Unable to process your withdrawal right now." },
        { status: 500 }
      );
    }
  }

  const messageLines = [
    "*Withdrawal Request*",
    "",
    `User: ${user.username}`,
    `Email: ${user.email}`,
    `User ID: ${user.id}`,
    `Previous Balance: ${balanceBefore.toFixed(2)} pts`,
    `New Balance: ${Number(updatedUser.balance).toFixed(2)} pts`,
    `Pending Leads: ${Number(user.pending).toFixed(2)} pts`,
    "",
    `Requested Option: ${selectedOption.label}`,
    `Option Details: ${selectedOption.details}`,
    `Points Deducted: ${selectedOption.points.toFixed(2)} pts`,
    "",
    `User Note: ${note.length ? note : "None"}`,
  ];

  const message = messageLines.join("\n");

  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    }
  );

  if (!telegramResponse.ok) {
    const errorText = await telegramResponse.text();
    console.error("Telegram API error:", errorText);

    if (selectedOption.points > 0) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: selectedOption.points },
          },
        });
      } catch (restoreError) {
        console.error(
          "Failed to restore balance after Telegram failure:",
          restoreError
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to notify support team. Try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message:
      "Withdrawal request submitted! We'll follow up in Telegram within 24 hours.",
    balance: Number(updatedUser.balance).toFixed(2),
  });
}
