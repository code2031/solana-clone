import { NextRequest, NextResponse } from "next/server";
import { auditCode } from "@/lib/auditor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    if (code.length > 50000) {
      return NextResponse.json(
        { error: "Code exceeds maximum length of 50,000 characters" },
        { status: 400 }
      );
    }

    const result = auditCode(code);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      engine: "SolClone Static Analysis v1.0",
    });
  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json(
      { error: "Failed to audit code" },
      { status: 500 }
    );
  }
}
