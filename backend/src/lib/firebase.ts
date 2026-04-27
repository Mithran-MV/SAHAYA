import { initializeApp, applicationDefault, getApps, type App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { config } from './config';
import { logger } from './logger';

let _app: App | null = null;
let _db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(config.firebase.projectId);
}

export function getDb(): Firestore {
  if (_db) return _db;
  if (!config.firebase.projectId) {
    throw new Error('Firestore not configured: FIREBASE_PROJECT_ID missing');
  }
  if (getApps().length === 0) {
    _app = initializeApp({
      credential: applicationDefault(),
      projectId: config.firebase.projectId,
    });
    logger.info({ projectId: config.firebase.projectId }, 'firebase admin initialized');
  }
  _db = getFirestore();
  return _db;
}

export { Timestamp, FieldValue };
