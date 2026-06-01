import { NextResponse } from "next/server";
import { z } from "zod";

const applicationSchema = z.object({
  robloxUsername: z.string().trim().min(3).max(32),
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    applicationSchema.parse(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Enter a valid Roblox username and email." },
        { status: 400 }
      );
    }

    console.error("Claim Plus application failed", error);
    return NextResponse.json(
      { error: "Unable to submit application right now." },
      { status: 500 }
    );
  }
}
