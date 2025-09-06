import { NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export async function GET() {
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

    const analysisResults = [];
    const unmappedFiles = [];
    let totalFiles = 0;
    let analyzedFiles = 0;
    let approvedFiles = 0;
    let rejectedFiles = 0;
    let majorErrors = 0;

    // List all blobs in the container
    for await (const blob of containerClient.listBlobsFlat({
      includeMetadata: true,
      includeSnapshots: false,
    })) {
      // Skip analysis result files
      if (blob.name.endsWith('.analysis.json')) {
        continue;
      }

      totalFiles++;

      // Check if this file has analysis metadata
      if (blob.metadata && blob.metadata.status === 'completed') {
        analyzedFiles++;
        
        // Try to load full analysis result
        let analysisData = null;
        try {
          const analysisFileName = `${blob.name}.analysis.json`;
          const analysisBlobClient = containerClient.getBlobClient(analysisFileName);
          const downloadResponse = await analysisBlobClient.download(0);
          const analysisText = await streamToString(downloadResponse.readableStreamBody as any);
          analysisData = JSON.parse(analysisText);
        } catch (error) {
          console.log(`No detailed analysis found for ${blob.name}`);
        }

        // Determine document type and status
        const documentType = blob.metadata.documenttype || analysisData?.documentType || 'Unknown';
        const confidence = parseFloat(blob.metadata.confidence || '0') * 100;
        
        // Mock approval status based on confidence and document type
        let approvalStatus: 'Approved' | 'Rejected' | 'Pending' | 'N/A' = 'N/A';
        let criteria = 'N/A';

        if (confidence > 90) {
          approvalStatus = 'Approved';
          approvedFiles++;
          criteria = '9/9';
        } else if (confidence > 70) {
          approvalStatus = Math.random() > 0.5 ? 'Approved' : 'Rejected';
          if (approvalStatus === 'Approved') {
            approvedFiles++;
            criteria = '8/9';
          } else {
            rejectedFiles++;
            criteria = '7/9';
            majorErrors++;
          }
        } else if (confidence > 0) {
          approvalStatus = 'Rejected';
          rejectedFiles++;
          criteria = '5/9';
          majorErrors++;
        }

        // Create analysis result
        const analysisResult = {
          id: blob.name.replace(/[^a-zA-Z0-9]/g, ''),
          name: getDocumentDisplayName(blob.name, documentType),
          type: documentType,
          matchPercentage: Math.round(confidence),
          criteria: criteria,
          approvalStatus: approvalStatus,
          action: '...',
          details: {
            extractedFields: analysisData?.extractedData?.keyValuePairs?.slice(0, 3).map((pair: { key: string; value: string; confidence: number }) => ({
              field: pair.key,
              value: pair.value,
              confidence: Math.round(pair.confidence * 100)
            })) || [],
            issues: confidence < 70 ? ['Low confidence detection', 'Manual review required'] : undefined,
            recommendations: confidence < 50 ? ['Re-upload with better quality', 'Ensure document is clear'] : undefined
          }
        };

        analysisResults.push(analysisResult);
      } else {
        // This is an unmapped file
        const fileSize = formatBytes(blob.properties.contentLength || 0);
        const fileType = getFileType(blob.name);
        
        unmappedFiles.push({
          name: blob.name,
          type: fileType,
          size: fileSize
        });
      }
    }

    // Calculate summary statistics
    const overallProgress = totalFiles > 0 ? Math.round((analyzedFiles / totalFiles) * 100) : 0;

    const summary = {
      totalFiles,
      analyzedFiles,
      unmappedFiles: unmappedFiles.length,
      approvedFiles,
      rejectedFiles,
      majorErrors,
      overallProgress
    };

    return NextResponse.json({
      summary,
      analysisResults,
      unmappedFiles: unmappedFiles.slice(0, 8) // Limit to 8 for UI
    });
  } catch (error) {
    console.error('Error fetching analysis summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis summary' },
      { status: 500 }
    );
  }
}

// Helper functions
async function streamToString(readableStream: any): Promise<string> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new TextDecoder().decode(concatenated);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['doc', 'docx'].includes(ext || '')) return 'document';
  return 'file';
}

function getDocumentDisplayName(filename: string, documentType: string): string {
  // Generate user-friendly names based on document type
  const typeMap: Record<string, string> = {
    'unknown': 'Unidentified Document',
    'invoice': 'Invoice',
    'receipt': 'Receipt',
    'contract': 'Contract',
    'certificate': 'BANK Certificate',
    'identity': 'Identity Document',
    'statement': 'Statement',
    'report': 'Suitability report',
    'plan': 'Verification plan',
    'consent': 'Owners consent',
    'environmental': 'Statement of environmental effects'
  };

  const baseType = documentType.toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (baseType.includes(key)) {
      return value;
    }
  }

  return documentType || filename;
}