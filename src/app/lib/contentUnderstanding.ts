export interface DocumentAnalysisResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  documentType?: string;
  confidence?: number;
  extractedData?: {
    text?: string;
    keyValuePairs?: Array<{
      key: string;
      value: string;
      confidence: number;
    }>;
    tables?: Array<{
      rowCount: number;
      columnCount: number;
      cells: Array<{
        text: string;
        rowIndex: number;
        columnIndex: number;
      }>;
    }>;
    entities?: Array<{
      text: string;
      category: string;
      confidence: number;
    }>;
  };
  processedAt?: string;
  error?: string;
}

export interface AnalyzeDocumentRequest {
  url: string;
}

export interface ContentUnderstandingResponse {
  id: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  status: string;
  result?: {
    documents?: Array<{
      docType: string;
      confidence: number;
      fields: Record<string, any>;
    }>;
    content: string;
    pages?: Array<{
      pageNumber: number;
      lines: Array<{
        content: string;
      }>;
    }>;
    tables?: Array<{
      rowCount: number;
      columnCount: number;
      cells: Array<{
        content: string;
        rowIndex: number;
        columnIndex: number;
      }>;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class ContentUnderstandingService {
  private endpoint: string;
  private apiKey: string;
  private analyzerId: string;
  private apiVersion: string;

  constructor() {
    this.endpoint = process.env.FOUNDRY_ENDPOINT!;
    this.apiKey = process.env.FOUNDRY_KEY!;
    this.analyzerId = process.env.FOUNDRY_ANALYZER_ID!;
    this.apiVersion = process.env.FOUNDRY_API_VERSION!;

    if (!this.endpoint || !this.apiKey || !this.analyzerId || !this.apiVersion) {
      throw new Error('Missing required Content Understanding configuration');
    }
  }

  private get analyzeUrl() {
    return `${this.endpoint}/contentunderstanding/analyzers/${this.analyzerId}:analyze?api-version=${this.apiVersion}`;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': this.apiKey,
    };
  }

  /**
   * Start document analysis
   */
  async analyzeDocument(fileUrl: string): Promise<{ operationId: string; operationLocation: string }> {
    try {
      console.log('Starting document analysis for URL:', fileUrl);
      console.log('Using analyze URL:', this.analyzeUrl);
      
      const response = await fetch(this.analyzeUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ url: fileUrl }),
      });

      console.log('Analysis response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analysis API error response:', errorText);
        throw new Error(`Content Understanding API error: ${response.status} - ${errorText}`);
      }

      // Get operation ID from response headers
      const operationLocation = response.headers.get('Operation-Location');
      console.log('Operation-Location header:', operationLocation);
      
      if (!operationLocation) {
        throw new Error('No Operation-Location header in response');
      }

      // Extract operation ID from the operation location URL
      const operationId = operationLocation.split('/').pop()?.split('?')[0];
      if (!operationId) {
        throw new Error('Could not extract operation ID from Operation-Location header');
      }

      console.log('Analysis started successfully, operation ID:', operationId);

      return {
        operationId,
        operationLocation,
      };
    } catch (error) {
      console.error('Error starting document analysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis results
   */
  async getAnalysisResult(operationLocation: string): Promise<ContentUnderstandingResponse> {
    try {
      const response = await fetch(operationLocation, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Content Understanding API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting analysis result:', error);
      throw error;
    }
  }

  /**
   * Poll for analysis completion
   */
  async pollForCompletion(
    operationLocation: string,
    maxAttempts: number = 60, // Increased from 30 to 60 (2 minutes total)
    intervalMs: number = 2000
  ): Promise<ContentUnderstandingResponse> {
    let attempts = 0;
    console.log(`Starting polling for completion. Max attempts: ${maxAttempts}, interval: ${intervalMs}ms`);

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const result = await this.getAnalysisResult(operationLocation);
        console.log(`Polling attempt ${attempts}/${maxAttempts}, status: ${result.status}`);

        if (result.status === 'Succeeded' || result.status === 'succeeded') {
          console.log('Analysis completed successfully');
          return result;
        }
        
        if (result.status === 'Failed' || result.status === 'failed') {
          console.log('Analysis failed:', result.error);
          return result;
        }

        // Status is still running/processing - wait before next attempt
        if (attempts < maxAttempts) {
          console.log(`Status: ${result.status}, waiting ${intervalMs}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(`Error during polling attempt ${attempts}:`, error);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }
    }

    console.error(`Analysis polling timeout after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s total)`);
    throw new Error(`Analysis polling timeout after ${maxAttempts} attempts`);
  }

  /**
   * Transform Content Understanding response to our internal format
   */
  transformToDocumentAnalysisResult(
    operationId: string,
    response: ContentUnderstandingResponse
  ): DocumentAnalysisResult {
    if (response.status === 'Failed' || response.status === 'failed') {
      return {
        id: operationId,
        status: 'failed',
        error: response.error?.message || 'Analysis failed',
        processedAt: response.lastUpdatedDateTime,
      };
    }

    if ((response.status !== 'Succeeded' && response.status !== 'succeeded') || !response.result) {
      return {
        id: operationId,
        status: 'processing',
      };
    }

    const result = response.result;
    const document = result.documents?.[0];

    // Extract key-value pairs from document fields
    const keyValuePairs = document?.fields
      ? Object.entries(document.fields).map(([key, value]: [string, { content?: string; confidence?: number } | string]) => ({
          key,
          value: typeof value === 'object' ? value.content || JSON.stringify(value) : String(value),
          confidence: typeof value === 'object' ? value.confidence || 0 : 1,
        }))
      : [];

    // Transform tables
    const tables = result.tables?.map(table => ({
      rowCount: table.rowCount,
      columnCount: table.columnCount,
      cells: table.cells.map(cell => ({
        text: cell.content,
        rowIndex: cell.rowIndex,
        columnIndex: cell.columnIndex,
      })),
    })) || [];

    return {
      id: operationId,
      status: 'completed',
      documentType: document?.docType || 'unknown',
      confidence: document?.confidence || 0,
      extractedData: {
        text: result.content || '',
        keyValuePairs,
        tables,
        entities: [], // Content Understanding doesn't provide entities in the same format
      },
      processedAt: response.lastUpdatedDateTime,
    };
  }

  /**
   * Complete analysis workflow
   */
  async analyzeDocumentComplete(fileUrl: string): Promise<DocumentAnalysisResult> {
    try {
      console.log('Starting complete document analysis workflow for:', fileUrl);
      
      // Start analysis
      const { operationId, operationLocation } = await this.analyzeDocument(fileUrl);

      // Poll for completion with extended timeout for large documents
      const response = await this.pollForCompletion(operationLocation, 90, 3000); // 4.5 minutes total

      // Transform and return result
      const result = this.transformToDocumentAnalysisResult(operationId, response);
      console.log('Complete document analysis finished:', result.status);
      console.log('Analysis result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Complete document analysis failed:', error);
      
      // Return a failed result instead of throwing to preserve error info
      return {
        id: 'unknown',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown analysis error',
        processedAt: new Date().toISOString(),
      };
    }
  }
}