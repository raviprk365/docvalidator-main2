import { NextRequest, NextResponse } from "next/server";
import { ContentUnderstandingService } from "@/app/lib/contentUnderstanding";

export async function GET(request: NextRequest) {
  try {
    // Check for authentication cookie
    const cookies = request.cookies;
    const userCookie = cookies.get("doc-validator-user");
    
    if (!userCookie) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const contentUnderstandingService = new ContentUnderstandingService();
    const analyzers = await contentUnderstandingService.listAnalyzers();

    return NextResponse.json({ 
      analyzers,
      success: true 
    });

  } catch (error) {
    console.error("Error listing analyzers:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to list analyzers",
        success: false 
      },
      { status: 500 }
    );
  }
}