import { NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    
    // Require folder parameter - no root folder access
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder parameter is required' },
        { status: 400 }
      );
    }
    
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
    
    // Set prefix for the specific application folder
    const prefix = `${folder}/`;
    
    // List blobs with the application folder prefix
    for await (const blob of containerClient.listBlobsFlat({
      includeMetadata: true,
      includeSnapshots: false,
      prefix: prefix,
    })) {
      // Skip analysis result files and folder placeholder files
      if (blob.name.endsWith('.analysis.json') || blob.name.endsWith('.folder_created')) {
        continue;
      }

      // Only include direct children of this application folder (not nested)
      const relativePath = blob.name.substring(prefix.length);
      if (relativePath.includes('/')) {
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
            const analysisData = await streamToString(downloadResponse.readableStreamBody as NodeJS.ReadableStream);
            analysisResult = JSON.parse(analysisData);
          } catch (error) {
            console.log(`No analysis file found for ${blob.name}`);
          }
        } else if (blob.metadata.status === 'failed') {
          status = 'rejected';
        }
      }

      // Generate SAS URL for read-only access
      let fileUrl = null;
      try {
        const sasToken = generateBlobSASQueryParameters(
          {
            containerName,
            blobName: blob.name,
            permissions: BlobSASPermissions.parse("r"), // read-only
            startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago
            expiresOn: new Date(new Date().valueOf() + 4 * 60 * 60 * 1000), // 4 hours expiry
            version: "2020-08-04",
          },
          credential
        ).toString();

        fileUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blob.name)}?${sasToken}`;
      } catch (sasError) {
        console.error(`Error generating SAS URL for ${blob.name}:`, sasError);
      }

      files.push({
        id: blob.name,
        name: blob.name,
        size: formatBytes(blob.properties.contentLength || 0),
        status,
        uploadDate: blob.properties.lastModified?.toISOString() || new Date().toISOString(),
        analysisResult,
        metadata: blob.metadata,
        url: fileUrl,
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
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    readableStream.on('error', (err) => reject(err));
    readableStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}