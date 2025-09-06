import { NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import { ContentUnderstandingService } from '@/app/lib/contentUnderstanding';

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    // Generate a read SAS URL for the Content Understanding API
    const readSasUrl = await generateReadSasUrl(fileName);
    console.log('Generated read SAS URL for analysis:', readSasUrl);

    // Verify the URL is accessible
    try {
      const testResponse = await fetch(readSasUrl, { method: 'HEAD' });
      console.log('SAS URL accessibility test:', testResponse.status, testResponse.statusText);
      if (!testResponse.ok) {
        throw new Error(`Blob not accessible: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error accessing blob URL:', error);
      throw new Error(`Cannot access blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Initialize Content Understanding service
    const contentService = new ContentUnderstandingService();

    // Analyze the document using the SAS URL
    const analysisResult = await contentService.analyzeDocumentComplete(readSasUrl);

    // Update blob metadata with analysis results
    if (analysisResult.status === 'completed') {
      await updateBlobMetadata(fileName, analysisResult);
    }

    return NextResponse.json({
      success: true,
      analysisResult,
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateReadSasUrl(fileName: string): Promise<string> {
  const accountName = process.env.AZURE_ACCOUNT_NAME!;
  const accountKey = process.env.AZURE_ACCOUNT_KEY!;
  const containerName = process.env.AZURE_CONTAINER_NAME!;

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  // Generate SAS token with read permissions for Content Understanding
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: fileName,
      permissions: BlobSASPermissions.parse("r"), // read only
      startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago to account for clock skew
      expiresOn: new Date(new Date().valueOf() + 2 * 60 * 60 * 1000), // 2 hours for processing
      version: "2020-08-04", // Use a valid API version
    },
    sharedKeyCredential
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${fileName}?${sasToken}`;
}

async function updateBlobMetadata(fileName: string, analysisResult: { 
  documentType?: string; 
  confidence?: number; 
  status: string; 
  processedAt?: string;
  extractedData?: {
    text?: string;
    keyValuePairs?: Array<{ key: string; value: string; confidence: number }>;
  };
}) {
  try {
    const accountName = process.env.AZURE_ACCOUNT_NAME!;
    const accountKey = process.env.AZURE_ACCOUNT_KEY!;
    const containerName = process.env.AZURE_CONTAINER_NAME!;

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(fileName);

    // Prepare metadata (Azure metadata keys must be lowercase and alphanumeric)
    const metadata: Record<string, string> = {
      documenttype: analysisResult.documentType || 'unknown',
      confidence: String(analysisResult.confidence || 0),
      status: analysisResult.status,
      processedat: analysisResult.processedAt || new Date().toISOString(),
      extractedtext: analysisResult.extractedData?.text?.substring(0, 1000) || '', // Limit metadata size
    };

    // Add key-value pairs as metadata (limited by Azure metadata size constraints)
    if (analysisResult.extractedData?.keyValuePairs) {
      const kvPairs = analysisResult.extractedData.keyValuePairs.slice(0, 5); // Limit to first 5 pairs
      kvPairs.forEach((pair: { key: string; value: string; confidence: number }, index: number) => {
        metadata[`kv${index}key`] = pair.key.substring(0, 100);
        metadata[`kv${index}value`] = pair.value.substring(0, 200);
        metadata[`kv${index}confidence`] = String(pair.confidence);
      });
    }

    // Store full analysis result as a separate blob for complete data
    const fullResultBlobName = `${fileName}.analysis.json`;
    const fullResultBlobClient = containerClient.getBlockBlobClient(fullResultBlobName);
    await fullResultBlobClient.upload(
      JSON.stringify(analysisResult, null, 2),
      JSON.stringify(analysisResult).length,
      {
        blobHTTPHeaders: {
          blobContentType: 'application/json',
        },
        metadata: {
          originalfile: fileName,
          resulttype: 'document-analysis',
        },
      }
    );

    // Update original blob metadata
    await blobClient.setMetadata(metadata);

    console.log(`Updated metadata for blob: ${fileName}`);
  } catch (error) {
    console.error('Error updating blob metadata:', error);
    // Don't throw here - we don't want to fail the entire analysis if metadata update fails
  }
}