import { NextResponse } from "next/server";
import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    const accountName = process.env.AZURE_ACCOUNT_NAME!;
    const accountKey = process.env.AZURE_ACCOUNT_KEY!;
    const containerName = process.env.AZURE_CONTAINER_NAME!;

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Define SAS permissions
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("rcw"), // read + create + write
        startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago to account for clock skew
        expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 1 hour
        version: "2020-08-04", // Use a valid API version
      },
      sharedKeyCredential
    ).toString();

    const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${fileName}?${sasToken}`;

    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error generating SAS URL" }, { status: 500 });
  }
}
