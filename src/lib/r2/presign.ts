import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2PrivateClient, r2PublicClient, R2_PRIVATE_BUCKET, R2_PUBLIC_BUCKET } from './client';

export async function createPresignedUploadUrl({
  bucket,
  key,
  mimeType,
  size,
  expiresInSeconds = 300,
}: {
  bucket: 'public' | 'private';
  key: string;
  mimeType: string;
  size: number;
  expiresInSeconds?: number;
}) {
  const client = bucket === 'public' ? r2PublicClient : r2PrivateClient;
  const bucketName = bucket === 'public' ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET;

  console.log('[R2 PRESIGN]', { bucket: bucketName, key, mimeType, size });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: mimeType,
    ContentLength: size,
    CacheControl: bucket === 'public' ? 'public, max-age=31536000, immutable' : 'private, no-store',
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  console.log('[R2 PRESIGN] URL generated:', url.slice(0, 80) + '...');
  return url;
}