import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Log headers for debugging (Vercel environment specifics)
    console.log(req.headers);

    // Extract IP address from headers with enhanced security
    const rawIp = req.headers.get("x-forwarded-for");
    const ip = rawIp ? rawIp.split(",")[0].trim() : req.socket.remoteAddress;
    console.log("Extracted IP:", ip);

    // Handle missing IP
    if (!ip) {
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 400 }
      );
    }

    // Fetch location data, handling potential errors gracefully
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    console.log("Fetch response status:", response.status);

    // If the API returns an error status, handle it
    if (!response.ok) {
      console.error("Failed to fetch location data");
      return NextResponse.json({ error: "Location data unavailable" });
    }

    const locationData = await response.json();
    return NextResponse.json(locationData);
  } catch (error) {
    console.error("Error fetching location data:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
