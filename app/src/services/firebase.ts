import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, initializeAuth, inMemoryPersistence, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';

const emulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = emulator || Object.values(config).every(Boolean);
export const usingEmulators = emulator;
let services: { auth: Auth; db: Firestore } | undefined;

// Lazy initialization: no Firebase instance until the user opens the connection.
export function getFirebase() {
  if (services) return services;
  if (!firebaseConfigured) throw new Error('Firebase todavía no está configurado.');
  const options = emulator ? { apiKey: 'demo-api-key', authDomain: 'demo-alianza.firebaseapp.com', projectId: 'demo-alianza', appId: 'demo-alianza' } : config;
  const app = getApps().length ? getApp() : initializeApp(options);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (emulator) {
    const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
  }
  services = { auth, db };
  return services;
}

export function friendlyError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'No se pudo iniciar sesión. Revisa tu correo y contraseña.',
    'auth/invalid-login-credentials': 'No se pudo iniciar sesión. Revisa tu correo y contraseña.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/email-already-in-use': 'No se pudo crear la cuenta. Intenta iniciar sesión o recuperar el acceso.',
    'auth/weak-password': 'Utiliza una contraseña de al menos 12 caracteres.',
    'auth/too-many-requests': 'Se hicieron demasiados intentos. Espera antes de volver a intentar.',
    'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión y vuelve a intentar.',
    'permission-denied': 'No tienes permiso para esta operación. Revisa la activación de tu cuenta.',
    'unavailable': 'El servicio no está disponible. Tus cambios no se han confirmado; vuelve a intentar.',
    'failed-precondition': 'Falta configuración de la base de datos. Contacta al administrador.',
    'auth/operation-not-allowed': 'El acceso por correo todavía no está habilitado en Firebase.',
  };
  return messages[code || ''] || 'No se pudo completar la operación. Intenta nuevamente.';
}
