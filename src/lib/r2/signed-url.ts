import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  r2PrivateClient,
  R2_PRIVATE_BUCKET,
} from './client';

export async function createSignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 60
) {
  const command = new GetObjectCommand({
    Bucket: R2_PRIVATE_BUCKET,
    Key: storageKey,
  });

  return getSignedUrl(r2PrivateClient, command, {
    expiresIn: expiresInSeconds,
  });
}