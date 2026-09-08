import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  r2PublicClient,
  r2PrivateClient,
  R2_PUBLIC_BUCKET,
  R2_PRIVATE_BUCKET,
} from './client';

export async function deleteObject(
  bucket: 'public' | 'private',
  storageKey: string
) {
  const bucketName =
    bucket === 'public'
      ? R2_PUBLIC_BUCKET
      : R2_PRIVATE_BUCKET;

  const client =
    bucket === 'public'
      ? r2PublicClient
      : r2PrivateClient;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    })
  );
}