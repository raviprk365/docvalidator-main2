import { NextResponse } from "next/server";
import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: "fileName parameter is required" }, { status: 400 });
    }

    const accountName = process.env.AZURE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_CONTAINER_NAME;

    if (!accountName || !accountKey || !containerName) {
      console.error('Missing Azure configuration:', { accountName: !!accountName, accountKey: !!accountKey, containerName: !!containerName });
      return NextResponse.json({ error: "Azure configuration is incomplete" }, { status: 500 });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Generate read-only SAS token for viewing
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("r"), // read-only
        startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago
        expiresOn: new Date(new Date().valueOf() + 4 * 60 * 60 * 1000), // 4 hours expiry
        version: "2020-08-04",
      },
      sharedKeyCredential
    ).toString();

    const viewUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(fileName)}?${sasToken}`;

    return NextResponse.json({ 
      url: viewUrl,
      fileName,
      expiresAt: new Date(new Date().valueOf() + 4 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    console.error('Error generating document URL:', err);
    return NextResponse.json({ 
      error: "Error generating document URL",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const accountName = process.env.AZURE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_CONTAINER_NAME;

    if (!accountName || !accountKey || !containerName) {
      return NextResponse.json({ error: "Azure configuration is incomplete" }, { status: 500 });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Generate read-only SAS token for viewing
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("r"), // read-only
        startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago
        expiresOn: new Date(new Date().valueOf() + 4 * 60 * 60 * 1000), // 4 hours expiry
        version: "2020-08-04",
      },
      sharedKeyCredential
    ).toString();

    const viewUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(fileName)}?${sasToken}`;

    return NextResponse.json({ 
      url: viewUrl,
      fileName,
      expiresAt: new Date(new Date().valueOf() + 4 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    console.error('Error generating document URL:', err);
    return NextResponse.json({ 
      error: "Error generating document URL",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}