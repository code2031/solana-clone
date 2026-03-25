import { NextRequest, NextResponse } from "next/server";
import { analyzePortfolio } from "@/lib/analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Basic Solana address validation (base58, 32-44 chars)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Solana wallet address format" },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const analysis = analyzePortfolio(walletAddress);

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
      note: "This analysis uses mock data for demonstration. Connect to mainnet RPC for live data.",
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze portfolio" },
      { status: 500 }
    );
  }
}
