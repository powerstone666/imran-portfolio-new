import { NextRequest, NextResponse } from "next/server";
import { askQwen } from "./qwen.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, audioUrl, audioBase64 } = body; 

    if (!message && !audioUrl && !audioBase64) {
      return NextResponse.json(
        { error: "Please provide a 'message' (txt), 'audioUrl', or 'audioBase64'." },
        { status: 400 }
      );
    }

    const result = await askQwen(message, audioUrl, audioBase64);
    
    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("GenAI Route Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
