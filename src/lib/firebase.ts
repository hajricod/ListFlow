import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Google Drive Provider & Scopes
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];
export const googleDriveProvider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => googleDriveProvider.addScope(scope));
googleDriveProvider.setCustomParameters({ prompt: 'select_account' });

// In-Memory Token Cache (MANDATORY: Never store access token in localStorage/sessionStorage)
let cachedDriveAccessToken: string | null = null;

export function getCachedDriveToken(): string | null {
  return cachedDriveAccessToken;
}

export function setCachedDriveToken(token: string | null) {
  cachedDriveAccessToken = token;
}

// Firestore Instance with offline persistence & multi-tab caching to minimize billable reads
function initDb(): Firestore {
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  try {
    if (databaseId) {
      return initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        databaseId
      );
    }
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return databaseId
      ? getFirestore(app, databaseId)
      : getFirestore(app);
  }
}

export const db = initDb();

// Sign In with Google
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Sign Up with Email and Password (supports any email: Outlook, Yahoo, iCloud, custom domain, Gmail)
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && displayName.trim()) {
    try {
      await updateProfile(result.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not set displayName on signup:', e);
    }
  }
  return result.user;
}

// Sign In with Email and Password (supports any email provider)
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

// Send Password Reset Email
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

// Connect to Google Drive (obtains OAuth access token with drive.file scope)
export async function connectGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  const result = await signInWithPopup(auth, googleDriveProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Failed to obtain Google Drive access token');
  }
  cachedDriveAccessToken = credential.accessToken;
  return { user: result.user, accessToken: cachedDriveAccessToken };
}

// Sign Out
export async function signOut(): Promise<void> {
  cachedDriveAccessToken = null;
  await firebaseSignOut(auth);
}

// Auth State Listener
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedDriveAccessToken = null;
    }
    callback(user);
  });
}

