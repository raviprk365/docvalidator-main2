import { ContentUnderstandingService } from "@/app/lib/contentUnderstanding";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { analyzerId: string } }
) {
  try {
    const { analyzerId } = params;
    const contentUnderstandingService = new ContentUnderstandingService();
    const analyzer = await contentUnderstandingService.getAnalyzer(analyzerId);

    return NextResponse.json(analyzer);
  } catch (error) {
    console.error("Error fetching analyzer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch analyzer",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { analyzerId: string } }
) {
  try {
    const { analyzerId } = params;
    const analyzerData = await request.json();
    const url = new URL(request.url);
    const replaceMode = url.searchParams.get('replace') === 'true';

    const contentUnderstandingService = new ContentUnderstandingService();
    
    let result;
    if (replaceMode) {
      // Use the new replaceAnalyzer method for replace mode
      result = await contentUnderstandingService.replaceAnalyzer(
        analyzerId,
        analyzerData
      );
    } else {
      // Use the existing createOrReplaceAnalyzer for create mode
      result = await contentUnderstandingService.createOrReplaceAnalyzer(
        analyzerId,
        analyzerData
      );
    }

    return NextResponse.json({
      success: true,
      analyzer: result,
    });
  } catch (error) {
    console.error("Error creating/replacing analyzer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create/replace analyzer",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { analyzerId: string } }
) {
  try {
    // Check for authentication cookie
    const cookies = request.cookies;
    const userCookie = cookies.get("doc-validator-user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { analyzerId } = params;
    const updateData = await request.json();

    const contentUnderstandingService = new ContentUnderstandingService();
    const result = await contentUnderstandingService.updateAnalyzer(
      analyzerId,
      updateData
    );

    return NextResponse.json({
      success: true,
      analyzer: result,
    });
  } catch (error) {
    console.error("Error updating analyzer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update analyzer",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { analyzerId: string } }
) {
  try {
    // Check for authentication cookie
    const cookies = request.cookies;
    const userCookie = cookies.get("doc-validator-user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { analyzerId } = params;
    const contentUnderstandingService = new ContentUnderstandingService();
    await contentUnderstandingService.deleteAnalyzer(analyzerId);

    return NextResponse.json({
      success: true,
      message: `Analyzer ${analyzerId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting analyzer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete analyzer",
      },
      { status: 500 }
    );
  }
}
