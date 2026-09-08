import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  r2PublicClient,
  r2PrivateClient,
  R2_PUBLIC_BUCKET,
  R2_PRIVATE_BUCKET,
} from './client';

export async function createPresignedUploadUrl({
  bucket,
  storageKey,
  mimeType,
  size,
}: {
  bucket: 'public' | 'private';
  storageKey: string;
  mimeType: string;
  size?: number;
}) {
  const bucketName =
    bucket === 'public' ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET;

  const client =
    bucket === 'public' ? r2PublicClient : r2PrivateClient;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
    ContentType: mimeType,
    ...(size !== undefined ? { ContentLength: size } : {}),
  });

  return getSignedUrl(client, command, {
    expiresIn: 900,
  });
}