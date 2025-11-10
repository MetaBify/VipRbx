import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const url = `https://dh9e7lxecq73l.cloudfront.net/public/external/check2.php?user_id=623910&api_key=525aedb31fa76c26997f25d2b15e501f=&s2=&callback=&testing=0`;

    const response = await axios.get(url);

    const data = response.data;

    console.log("API response data:", data);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      error: error.message || "Failed to fetch leads",
      data: [],
    });
  }
}
