import { NextResponse } from "next/server";
import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

export async function GET() {
  try {
    const accountName = process.env.AZURE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_CONTAINER_NAME;

    console.log('Environment check:');
    console.log('Account Name:', accountName ? `${accountName.substring(0, 3)}...` : 'undefined');
    console.log('Account Key:', accountKey ? `${accountKey.substring(0, 10)}...` : 'undefined');
    console.log('Container:', containerName);

    if (!accountName || !accountKey || !containerName) {
      return NextResponse.json({
        error: 'Missing Azure configuration',
        accountName: !!accountName,
        accountKey: !!accountKey,
        containerName: !!containerName,
      }, { status: 500 });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Test SAS token generation
    const testFileName = 'test-file.pdf';
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: testFileName,
        permissions: BlobSASPermissions.parse("rcw"), // read + create + write
        startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago
        expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 1 hour
        version: "2020-08-04",
      },
      sharedKeyCredential
    ).toString();

    const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${testFileName}?${sasToken}`;

    return NextResponse.json({
      success: true,
      accountName: `${accountName.substring(0, 3)}...`,
      containerName,
      sasToken: sasToken.substring(0, 50) + '...',
      uploadUrl: uploadUrl.substring(0, 100) + '...',
      sasParameters: {
        hasSignature: sasToken.includes('sig='),
        hasVersion: sasToken.includes('sv='),
        hasPermissions: sasToken.includes('sp='),
        hasResource: sasToken.includes('sr='),
        hasStartTime: sasToken.includes('st='),
        hasExpiryTime: sasToken.includes('se='),
      }
    });
  } catch (error) {
    console.error('SAS test error:', error);
    return NextResponse.json({
      error: 'SAS token generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}