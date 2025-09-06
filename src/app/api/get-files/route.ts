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

    const files = [];
    
    // List all blobs in the container
    for await (const blob of containerClient.listBlobsFlat({
      includeMetadata: true,
      includeSnapshots: false,
      prefix: '', // Only get files, not analysis results
    })) {
      // Skip analysis result files
      if (blob.name.endsWith('.analysis.json')) {
        continue;
      }

      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();

      // Determine status based on metadata
      let status: 'pending' | 'processing' | 'approved' | 'rejected' | 'analyzed' = 'pending';
      let analysisResult = null;

      if (blob.metadata) {
        if (blob.metadata.status === 'completed') {
          status = 'analyzed';
          
          // Try to load full analysis result
          try {
            const analysisFileName = `${blob.name}.analysis.json`;
            const analysisBlobClient = containerClient.getBlobClient(analysisFileName);
            const downloadResponse = await analysisBlobClient.download(0);
            const analysisData = await streamToString(downloadResponse.readableStreamBody as any);
            analysisResult = JSON.parse(analysisData);
          } catch (error) {
            console.log(`No analysis file found for ${blob.name}`);
          }
        } else if (blob.metadata.status === 'failed') {
          status = 'rejected';
        }
      }

      files.push({
        id: blob.name,
        name: blob.name,
        size: formatBytes(blob.properties.contentLength || 0),
        status,
        uploadDate: blob.properties.lastModified?.toISOString() || new Date().toISOString(),
        analysisResult,
        metadata: blob.metadata,
        url: `https://${accountName}.blob.core.windows.net/${containerName}/${blob.name}`,
      });
    }

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// Helper function to convert stream to string
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

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}