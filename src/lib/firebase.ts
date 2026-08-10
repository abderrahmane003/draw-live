import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

function getValidConfigValue(envVal: string | undefined, configVal: string | undefined): string {
  if (envVal && !envVal.includes('your_') && envVal.trim() !== '') {
    return envVal.trim();
  }
  return configVal || '';
}

const firebaseConfig = {
  apiKey: getValidConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, appletConfig.apiKey),
  authDomain: getValidConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, appletConfig.authDomain),
  projectId: getValidConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, appletConfig.projectId),
  storageBucket: getValidConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, appletConfig.storageBucket),
  messagingSenderId: getValidConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, appletConfig.messagingSenderId),
  appId: getValidConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, appletConfig.appId),
};

const rawDbId = getValidConfigValue(import.meta.env.VITE_FIREBASE_DATABASE_ID, appletConfig.firestoreDatabaseId);
const databaseId = rawDbId && rawDbId !== '(default)' ? rawDbId : undefined;

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('[Firestore ERROR]', JSON.stringify(errInfo));
}

// Log diagnostic metadata at startup
export async function runDiagnostics() {
  console.log('[Firebase] Project ID:', firebaseConfig.projectId);
  console.log('[Firebase] Auth Domain:', firebaseConfig.authDomain);
  console.log('[Firebase] App ID:', firebaseConfig.appId);
  console.log('[Firebase] Database:', databaseId || '(default)');

  try {
    const user = auth.currentUser;
    console.log('[Firebase] User UID:', user ? user.uid : 'Initializing...');
  } catch (e) {
    console.error('[Firebase] Auth Check Error:', e);
  }

  try {
    const testDocRef = doc(db, 'rooms', '_diagnostic_ping_');
    await getDocFromServer(testDocRef);
    console.log('[Firestore] Connection Test: SUCCESS');
  } catch (err) {
    console.warn('[Firestore] Connection Test Notice:', err);
  }
}

runDiagnostics();

export { signInAnonymously, onAuthStateChanged };
export type { User };


