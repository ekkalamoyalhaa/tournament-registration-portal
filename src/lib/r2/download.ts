import { GetObjectCommand } from '@aws-sdk/client-s3';
import {
  r2PrivateClient,
  R2_PRIVATE_BUCKET,
} from './client';

/**
 * Server-side download of a private object.
 *
 * For browser downloads, prefer createSignedDownloadUrl()
 * from signed-url.ts.
 */
export async function downloadObject(storageKey: string) {
  const command = new GetObjectCommand({
    Bucket: R2_PRIVATE_BUCKET,
    Key: storageKey,
  });

  return r2PrivateClient.send(command);
}