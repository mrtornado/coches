import crypto from 'node:crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return client;
}

function bucket(): string {
  return process.env.S3_BUCKET || '';
}

function publicBase(): string {
  return (process.env.S3_PUBLIC_URL || '').replace(/\/+$/, '');
}

export type UploadResult = { url: string; key: string };

export async function uploadImage(file: File): Promise<UploadResult> {
  const rawExt = file.name.includes('.') ? file.name.split('.').pop()! : 'jpg';
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `cars/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
    }),
  );

  return { url: `${publicBase()}/${key}`, key };
}

export async function deleteImage(key?: string | null): Promise<void> {
  if (!key) return;
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  } catch {
    // best-effort; ignore failures so deleting a car never blocks on S3
  }
}
