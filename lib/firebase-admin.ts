import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const isServerCloudMode = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;

let adminDb: any = null;
let adminAuth: any = null;

if (isServerCloudMode) {
  try {
    const apps = getApps();
    if (!apps.length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    adminDb = getFirestore();
    adminAuth = getAuth();
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
}

export { adminDb, adminAuth };
export const adminFirestore = adminDb;
