import { NextResponse } from 'next/server';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export async function POST(request: Request) {
  try {
    const { folderName } = await request.json();
    
    if (!folderName || typeof folderName !== 'string') {
      return NextResponse.json(
        { error: 'Folder name is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate folder name
    const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedFolderName.length === 0) {
      return NextResponse.json(
        { error: 'Folder name must contain at least one alphanumeric character' },
        { status: 400 }
      );
    }

    if (sanitizedFolderName.length > 50) {
      return NextResponse.json(
        { error: 'Folder name must be 50 characters or less' },
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

    // Check if folder already exists by looking for any blobs with this prefix
    let folderExists = false;
    try {
      for await (const _blob of containerClient.listBlobsFlat({ 
        prefix: `${sanitizedFolderName}/`
      })) {
        folderExists = true;
        break;
      }
    } catch (error) {
      console.log('Error checking folder existence:', error);
    }

    if (folderExists) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 409 }
      );
    }

    // Create a placeholder file to establish the folder structure
    // This is necessary because blob storage doesn't have true folders
    const placeholderBlobName = `${sanitizedFolderName}/.folder_created`;
    const placeholderContent = JSON.stringify({
      folderName: sanitizedFolderName,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      type: 'folder_placeholder'
    });

    const blobClient = containerClient.getBlockBlobClient(placeholderBlobName);
    
    await blobClient.upload(placeholderContent, placeholderContent.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json'
      },
      metadata: {
        folderPlaceholder: 'true',
        folderName: sanitizedFolderName,
        createdAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      success: true,
      folderName: sanitizedFolderName,
      message: 'Folder created successfully'
    });

  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}