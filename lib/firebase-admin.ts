import * as admin from 'firebase-admin';

export const isServerCloudMode = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;

let adminDb: any = null;
let adminAuth: any = null;

if (isServerCloudMode) {
  try {
    if (!(admin as any).apps?.length) {
      admin.initializeApp({
        credential: (admin as any).credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    adminDb = (admin as any).firestore();
    adminAuth = (admin as any).auth();
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
}

export { adminDb, adminAuth };
export const adminFirestore = adminDb;
