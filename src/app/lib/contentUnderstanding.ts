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
    contents?: Array<{
      docType: string;
      confidence: number;
      fields: Record<string, unknown>;
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

interface ContentUnderstandingSettings {
  endpoint: string;
  apiVersion: string;
  subscriptionKey?: string;
  aadToken?: string;
  analyzerId: string;
  userAgent?: string;
}

interface TokenProvider {
  (): string;
}

export class AzureContentUnderstandingClient {
  private endpoint: string;
  private apiVersion: string;
  private subscriptionKey?: string;
  private tokenProvider?: TokenProvider;
  private userAgent: string;
  private headers: Record<string, string>;

  constructor(settings: ContentUnderstandingSettings) {
    // Validate required parameters
    if (!settings.endpoint) {
      throw new Error('Endpoint must be provided');
    }
    if (!settings.apiVersion) {
      throw new Error('API version must be provided');
    }
    if (!settings.subscriptionKey && !settings.aadToken) {
      throw new Error('Either subscription_key or aad_token must be provided');
    }

    this.endpoint = settings.endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.apiVersion = settings.apiVersion;
    this.subscriptionKey = settings.subscriptionKey;
    this.userAgent = settings.userAgent || 'cu-sample-code-ts';
    
    // Set up token provider if AAD token is provided
    if (settings.aadToken) {
      this.tokenProvider = () => settings.aadToken!;
    }

    this.headers = this.getHeaders();
  }

  private getAnalyzeUrl(analyzerId: string): string {
    return `${this.endpoint}/contentunderstanding/analyzers/${analyzerId}:analyze?api-version=${this.apiVersion}&stringEncoding=utf16`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'x-ms-useragent': this.userAgent,
    };

    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    } else if (this.tokenProvider) {
      headers['Authorization'] = `Bearer ${this.tokenProvider()}`;
    }

    return headers;
  }

  /**
   * Begins the analysis of a file or URL using the specified analyzer.
   * 
   * @param analyzerId - The ID of the analyzer to use
   * @param fileLocation - The path to the file or the URL to analyze
   * @returns Response object with operation location
   */
  async beginAnalyze(analyzerId: string, fileLocation: string): Promise<Response> {
    let data: Record<string, unknown> | ArrayBuffer;
    let headers: Record<string, string>;

    // Check if it's a URL or file path
    if (fileLocation.startsWith('http://') || fileLocation.startsWith('https://')) {
      data = { url: fileLocation };
      headers = {
        'Content-Type': 'application/json',
        ...this.headers,
      };
    } else {
      // For file paths, we'd need to read the file as binary
      // In browser/Node.js context, this would typically be handled differently
      throw new Error('File path analysis not supported in this implementation. Use URL-based analysis.');
    }

    const analyzeUrl = this.getAnalyzeUrl(analyzerId);
    console.log(`Analyzing file ${fileLocation} with analyzer: ${analyzerId}`);

    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response;
  }

  /**
   * Get analysis results from operation location
   */
  private async getAnalysisResult(operationLocation: string): Promise<Record<string, unknown>> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.headers,
    };

    const response = await fetch(operationLocation, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Polls the result of an asynchronous operation until it completes or times out.
   * 
   * @param response - The initial response object containing the operation location
   * @param timeoutSeconds - The maximum number of seconds to wait for completion (default: 120)
   * @param pollingIntervalSeconds - The number of seconds to wait between polling attempts (default: 2)
   * @returns The JSON response of the completed operation
   */
  async pollResult(
    response: Response,
    timeoutSeconds: number = 120,
    pollingIntervalSeconds: number = 2
  ): Promise<Record<string, unknown>> {
    const operationLocation = response.headers.get('operation-location') || response.headers.get('Operation-Location');
    
    if (!operationLocation) {
      throw new Error('Operation location not found in response headers.');
    }

    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    const intervalMs = pollingIntervalSeconds * 1000;

    while (true) {
      const elapsed = Date.now() - startTime;
      console.log(`Waiting for service response (elapsed: ${(elapsed / 1000).toFixed(2)}s)`);
      
      if (elapsed > timeoutMs) {
        throw new Error(`Operation timed out after ${(elapsed / 1000).toFixed(2)} seconds.`);
      }

      const result = await this.getAnalysisResult(operationLocation);
      const status = ((result.status as string) || '').toLowerCase();
      
      if (status === 'succeeded') {
        console.log(`Request result is ready after ${(elapsed / 1000).toFixed(2)} seconds.`);
        return result;
      } else if (status === 'failed') {
        console.error('Request failed. Reason:', result);
        throw new Error('Request failed.');
      } else {
        const operationId = operationLocation.split('/').pop()?.split('?')[0] || 'unknown';
        console.log(`Request ${operationId} in progress ...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Transform Content Understanding response to our internal format
   */
  private transformToDocumentAnalysisResult(
    operationId: string,
    response: Record<string, unknown>
  ): DocumentAnalysisResult {
    const contentResponse = response as unknown as ContentUnderstandingResponse;
    
    if (contentResponse.status === 'Failed' || contentResponse.status === 'failed') {
      return {
        id: operationId,
        status: 'failed',
        error: contentResponse.error?.message || 'Analysis failed',
        processedAt: contentResponse.lastUpdatedDateTime,
      };
    }

    if ((contentResponse.status !== 'Succeeded' && contentResponse.status !== 'succeeded') || !contentResponse.result) {
      return {
        id: operationId,
        status: 'processing',
      };
    }

    const result = contentResponse.result;
    const document = result.contents?.[0];

    // Extract key-value pairs from document fields
    const keyValuePairs = document?.fields
      ? Object.entries(document.fields).map(([key, value]: [string, unknown]) => ({
          key,
          value: typeof value === 'object' && value ? String((value as Record<string, unknown>).valueString || (value as Record<string, unknown>).content || JSON.stringify(value)) : String(value || ''),
          confidence: typeof value === 'object' && value ? (value as Record<string, unknown>).confidence as number || 0 : 1,
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

    // Get documentType from DocType key in keyValuePairs, fallback to document.docType or 'unknown'
    const docTypeFromKVP = keyValuePairs.find(kvp => kvp.key.toLowerCase() === 'doctype')?.value;
    const documentType = docTypeFromKVP || document?.docType || 'unknown';

    return {
      id: operationId,
      status: 'completed',
      documentType: typeof documentType === 'string' ? documentType : 'Unknown',
      confidence: document?.confidence || 0,
      extractedData: {
        text: result.content || '',
        keyValuePairs,
        tables,
        entities: [], // Content Understanding doesn't provide entities in the same format
      },
      processedAt: contentResponse.lastUpdatedDateTime,
    };
  }
}

/**
 * Convenience wrapper class that maintains the original interface
 * but uses the new AzureContentUnderstandingClient internally
 */
export class ContentUnderstandingService {
  private client: AzureContentUnderstandingClient;
  private analyzerId: string;

  constructor() {
    const endpoint = process.env.FOUNDRY_ENDPOINT;
    const subscriptionKey = process.env.FOUNDRY_KEY;
    const analyzerId = process.env.FOUNDRY_ANALYZER_ID;
    const apiVersion = process.env.FOUNDRY_API_VERSION;

    if (!endpoint || !subscriptionKey || !analyzerId || !apiVersion) {
      throw new Error('Missing required Content Understanding configuration');
    }

    this.analyzerId = analyzerId;
    this.client = new AzureContentUnderstandingClient({
      endpoint,
      apiVersion,
      subscriptionKey,
      analyzerId,
      userAgent: 'docvalidator-service',
    });
  }

  /**
   * Complete analysis workflow - maintains original interface
   */
  async analyzeDocumentComplete(fileUrl: string): Promise<DocumentAnalysisResult> {
    try {
      console.log('Starting complete document analysis workflow for:', fileUrl);
      
      // Start analysis using new client
      const response = await this.client.beginAnalyze(this.analyzerId, fileUrl);
      
      // Get operation location and extract operation ID
      const operationLocation = response.headers.get('operation-location') || response.headers.get('Operation-Location');
      if (!operationLocation) {
        throw new Error('No operation location in response headers');
      }
      
      const operationId = operationLocation.split('/').pop()?.split('?')[0] || 'unknown';

      // Poll for completion with extended timeout for large documents
      const result = await this.client.pollResult(response, 270, 3); // 4.5 minutes total, 3 second intervals

      // Transform and return result
      const analysisResult = this.client['transformToDocumentAnalysisResult'](operationId, result);
      console.log('Complete document analysis finished:', analysisResult.status);
      console.log('Analysis result:', JSON.stringify(analysisResult, null, 2));
      return analysisResult;
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

  /**
   * Legacy method - start document analysis
   */
  async analyzeDocument(fileUrl: string): Promise<{ operationId: string; operationLocation: string }> {
    try {
      const response = await this.client.beginAnalyze(this.analyzerId, fileUrl);
      const operationLocation = response.headers.get('operation-location') || response.headers.get('Operation-Location');
      
      if (!operationLocation) {
        throw new Error('No Operation-Location header in response');
      }

      const operationId = operationLocation.split('/').pop()?.split('?')[0];
      if (!operationId) {
        throw new Error('Could not extract operation ID from Operation-Location header');
      }

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
   * Legacy method - get analysis results
   */
  async getAnalysisResult(operationLocation: string): Promise<ContentUnderstandingResponse> {
    const result = await this.client['getAnalysisResult'](operationLocation);
    return result as unknown as ContentUnderstandingResponse;
  }

  /**
   * Legacy method - poll for completion
   */
  async pollForCompletion(
    operationLocation: string,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<ContentUnderstandingResponse> {
    // Convert to timeout seconds and polling interval seconds
    const timeoutSeconds = (maxAttempts * intervalMs) / 1000;
    const pollingIntervalSeconds = intervalMs / 1000;
    
    // Create a fake response object with the operation location
    const fakeResponse = {
      headers: {
        get: (name: string) => name.toLowerCase() === 'operation-location' ? operationLocation : null
      }
    } as Response;

    const result = await this.client.pollResult(fakeResponse, timeoutSeconds, pollingIntervalSeconds);
    return result as unknown as ContentUnderstandingResponse;
  }

  /**
   * Legacy method - transform response
   */
  transformToDocumentAnalysisResult(
    operationId: string,
    response: ContentUnderstandingResponse
  ): DocumentAnalysisResult {
    return this.client['transformToDocumentAnalysisResult'](operationId, response as unknown as Record<string, unknown>);
  }
}