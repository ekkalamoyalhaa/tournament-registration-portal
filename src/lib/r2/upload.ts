import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_PUBLIC_BUCKET, R2_PRIVATE_BUCKET } from './client';

// PRD §17: direct-to-R2 uploads so large files never pass through the Linode
// server. Call this from a Server Action / Route Handler AFTER authentication,
// authorization, and validateUploadRequest() have all passed.
export async function createPresignedUploadUrl(params: {
  bucket: 'public' | 'private';
  storageKey: string;
  mimeType: string;
  expiresInSeconds?: number;
}) {
  const { bucket, storageKey, mimeType, expiresInSeconds = 300 } = params;
  const bucketName = bucket === 'public' ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
    ContentType: mimeType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
  return { uploadUrl: url, storageKey, bucket: bucketName };
}
