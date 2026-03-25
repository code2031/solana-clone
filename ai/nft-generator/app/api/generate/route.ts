import { NextRequest, NextResponse } from "next/server";
import { buildMetadata } from "@/lib/metadata-builder";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, negativePrompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt must be under 500 characters" },
        { status: 400 }
      );
    }

    const validStyles = ["pixel-art", "watercolor", "3d", "anime", "abstract"];
    const selectedStyle = validStyles.includes(style) ? style : "abstract";

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const nft = buildMetadata(prompt, selectedStyle, negativePrompt);

    return NextResponse.json({
      success: true,
      data: nft,
      timestamp: new Date().toISOString(),
      note: "This is a placeholder generation. In production, this would call an image generation API (DALL-E, Stable Diffusion, etc).",
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate NFT" },
      { status: 500 }
    );
  }
}
