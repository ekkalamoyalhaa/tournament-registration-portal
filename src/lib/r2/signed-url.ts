import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_PRIVATE_BUCKET } from './client';

// PRD §16: the browser should never receive a permanent public URL to a
// sensitive document. Call this only after an authorization check confirms
// the requesting user may view this specific document.
export async function createSignedDownloadUrl(storageKey: string, expiresInSeconds = 60) {
  const command = new GetObjectCommand({
    Bucket: R2_PRIVATE_BUCKET,
    Key: storageKey,
  });

  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}
