const fetchRobloxUser = async (username: string) => {
  try {
    const response = await fetch(`/api/getRobloxUser?username=${username}`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if the response contains an error or invalid data
    if (!data || data.error) {
      console.error(
        "Error fetching user data:",
        data?.error || "Unknown error"
      );
      return { error: data?.error || "Could not find user" };
    }

    return {
      ...data,
      avatarUrl: data.avatarUrl || null,
    };
  } catch (error) {
    console.error("Error while fetching Roblox user:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default fetchRobloxUser;
