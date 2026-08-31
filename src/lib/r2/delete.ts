import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_PUBLIC_BUCKET, R2_PRIVATE_BUCKET } from './client';

export async function deleteObject(bucket: 'public' | 'private', storageKey: string) {
  const bucketName = bucket === 'public' ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET;
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: storageKey }));
}
