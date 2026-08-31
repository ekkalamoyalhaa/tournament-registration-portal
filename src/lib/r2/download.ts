import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_PRIVATE_BUCKET } from './client';

// Server-side stream fetch, e.g. for building a ZIP export of documents.
// For browser access, prefer createSignedDownloadUrl (signed-url.ts) instead.
export async function getObjectStream(storageKey: string) {
  const result = await r2Client.send(
    new GetObjectCommand({ Bucket: R2_PRIVATE_BUCKET, Key: storageKey })
  );
  return result.Body;
}
