import { NextResponse } from 'next/server';
import { ContentUnderstandingService } from '@/app/lib/contentUnderstanding';

export async function GET() {
  try {
    const service = new ContentUnderstandingService();
    
    // Test with a simple public PDF URL
    const testUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
    console.log('Testing Content Understanding with URL:', testUrl);
    
    const { operationId, operationLocation } = await service.analyzeDocument(testUrl);
    
    // Get the initial status
    const initialStatus = await service.getAnalysisResult(operationLocation);
    
    return NextResponse.json({
      success: true,
      message: 'Content Understanding API is working',
      operationId,
      operationLocation,
      initialStatus,
      testUrl,
    });
  } catch (error) {
    console.error('Content Understanding test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    }, { status: 500 });
  }
}