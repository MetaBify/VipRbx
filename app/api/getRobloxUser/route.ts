import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Please provide a username in the request." },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching data for username: ${username}`);

    const userResponse = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username] }
    );

    // Check if user exists
    const user = userResponse.data?.data?.[0];
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user.id;

    const thumbnailsResponse = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot`,
      {
        params: {
          userIds: userId,
          size: "420x420",
          format: "Png",
          isCircular: "false",
        },
      }
    );

    const profilePictureUrl = thumbnailsResponse.data.data[0].imageUrl;
    console.log(profilePictureUrl);

    if (!profilePictureUrl) {
      return NextResponse.json(
        { error: "Failed to fetch user thumbnails." },
        { status: 500 }
      );
    }

    const responseData = {
      displayName: user.displayName,

      profilePictureUrl,
      username,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching Roblox user data:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
