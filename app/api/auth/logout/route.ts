import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieOptions.name);
  return NextResponse.json({ success: true });
}
