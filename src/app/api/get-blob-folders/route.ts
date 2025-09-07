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

    const folders = new Set<string>();
    
    // List all blobs and extract folder names from blob paths
    for await (const blob of containerClient.listBlobsFlat({
      includeMetadata: true,
    })) {
      // Extract folder name from blob path (everything before the first '/')
      const parts = blob.name.split('/');
      if (parts.length > 1) {
        // If blob is in a folder, add the folder name
        const folderName = parts[0];
        folders.add(folderName);
      }
      // We now discover ALL existing blob folders from the storage account
    }

    // Convert set to array and get folder info for all discovered folders
    const folderList = await Promise.all(
      Array.from(folders).map(async (folderName) => {
        const prefix = `${folderName}/`;
        
        // Count files in this folder and get metadata
        let fileCount = 0;
        let totalSize = 0;
        let lastModified = new Date(0);

        for await (const blob of containerClient.listBlobsFlat({ prefix })) {
          // Skip analysis files and placeholder files when counting
          if (blob.name.endsWith('.analysis.json') || blob.name.endsWith('.folder_created')) continue;
          
          // Only count direct children (not nested folders)
          const relativePath = blob.name.substring(prefix.length);
          if (relativePath.includes('/')) continue;

          fileCount++;
          totalSize += blob.properties.contentLength || 0;
          if (blob.properties.lastModified && blob.properties.lastModified > lastModified) {
            lastModified = blob.properties.lastModified;
          }
        }

        // If no files found but folder exists, get the creation date from any file in the folder
        if (fileCount === 0 && lastModified.getTime() === 0) {
          for await (const blob of containerClient.listBlobsFlat({ prefix, maxPageSize: 1 })) {
            if (blob.properties.lastModified) {
              lastModified = blob.properties.lastModified;
              break;
            }
          }
        }

        return {
          name: folderName,
          displayName: folderName,
          fileCount,
          totalSize: formatBytes(totalSize),
          lastModified: lastModified.toISOString(),
        };
      })
    );

    // Sort folders by name alphabetically
    folderList.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ folders: folderList });
  } catch (error) {
    console.error('Error fetching blob folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blob folders' },
      { status: 500 }
    );
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}