import { getStorage } from 'firebase-admin/storage';
import { config } from './config';
import { logger } from './logger';

function resolveBucketName(): string {
  if (process.env.FIREBASE_STORAGE_BUCKET) return process.env.FIREBASE_STORAGE_BUCKET;
  if (!config.firebase.projectId) {
    throw new Error('Cannot resolve storage bucket: FIREBASE_PROJECT_ID missing');
  }
  // Default Firebase Storage bucket for projects created after Oct 2024.
  // For older projects, set FIREBASE_STORAGE_BUCKET=<projectId>.appspot.com
  return `${config.firebase.projectId}.firebasestorage.app`;
}

export async function uploadPhoto(
  buf: Buffer,
  mimeType: string,
  path: string,
): Promise<string> {
  const bucketName = resolveBucketName();
  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(path);

  await file.save(buf, {
    contentType: mimeType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
      contentType: mimeType,
    },
    resumable: false,
  });
  await file.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${encodeURI(path)}`;
  logger.info({ path, bytes: buf.length, url }, 'photo uploaded to storage');
  return url;
}
