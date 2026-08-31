import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 is S3-compatible. Credentials live only on the server —
// never import this file from a Client Component. See PRD §39.
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET ?? 'tournament-public';
export const R2_PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET ?? 'tournament-private';
