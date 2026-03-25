import { NextRequest, NextResponse } from "next/server";
import { parseQuery } from "@/lib/query-parser";
import { executeQuery } from "@/lib/rpc-executor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const parsed = parseQuery(query);

    if (!parsed) {
      return NextResponse.json({
        success: false,
        error: "Could not understand the query. Try asking about balances, blocks, validators, TPS, or epoch info.",
        suggestions: [
          "What is the current epoch?",
          "Show network TPS",
          "List validators",
          "Balance of <address>",
        ],
      });
    }

    const result = await executeQuery(parsed);

    return NextResponse.json({
      success: true,
      parsed: {
        intent: parsed.intent,
        rpcMethod: parsed.rpcMethod,
        description: parsed.description,
      },
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
