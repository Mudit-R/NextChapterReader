export const moderationService = async (comment) => {
  try {
    const moderationUrl =
      import.meta.env.VITE_AI_SUGGESTION_URL ||
      import.meta.env.VITE_MODERATION_API_URL ||
      "https://comment-moderation-api.onrender.com";

    // 3.5s timeout controller so comments post fast even if free microservice is cold-starting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${moderationUrl}/api/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: comment }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to moderate comment");
    }

    const data = await response.json();
    return {
      is_appropriate: data.is_appropriate ?? true,
      message: data.message ?? "Comment analyzed",
      reasons: data.reasons ?? [],
    };
  } catch (error) {
    console.warn("Moderation service notice (proceeding):", error.message);
    return {
      is_appropriate: true,
      message: "Moderation bypassed (service offline/busy)",
      reasons: [],
    };
  }
};
