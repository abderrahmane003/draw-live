import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Single source of truth for Firebase configuration
const app: FirebaseApp = getApps().length === 0 ? initializeApp(appletConfig) : getApp();

const databaseId =
  appletConfig.firestoreDatabaseId && appletConfig.firestoreDatabaseId !== '(default)'
    ? appletConfig.firestoreDatabaseId
    : undefined;

export const auth = getAuth(app);
export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

console.log('🔥 [Firebase Single Config] Single source of truth: firebase-applet-config.json');
console.log('🔥 [Firebase Init] Project ID utilisé:', appletConfig.projectId);
console.log('🔥 [Firebase Init] Database ID utilisée:', databaseId || '(default)');

// Validate connection to server
async function testServerConnection() {
  try {
    await getDocFromServer(doc(db, 'healthcheck', 'connection'));
    console.log('✅ [Firestore Connection] Connecté avec succès à la base Firestore du serveur.');
  } catch (err) {
    console.log('ℹ️ [Firestore Connection] Validation du canal Firestore initialisée.');
  }
}
testServerConnection();

export { signInAnonymously, onAuthStateChanged };
export type { User };


