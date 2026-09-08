import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKey || !secretKey) {
  throw new Error('Missing R2 credentials in environment variables');
}

export const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET!;
export const R2_PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET!;

const config = {
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
};

export const r2PublicClient = new S3Client(config);
export const r2PrivateClient = new S3Client(config);