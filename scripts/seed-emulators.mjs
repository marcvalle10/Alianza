import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// Fail closed: this fixture can never use production resources.
for (const key of ['FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST']) {
  if (!/^127\.0\.0\.1:\d+$/.test(process.env[key] || '')) throw new Error(`${key} debe apuntar explícitamente a 127.0.0.1:puerto.`);
}
initializeApp({ projectId: 'demo-alianza' });
const auth = getAuth(), db = getFirestore();
for (const [uid, role, name] of [['demo-admin','admin','Administración de prueba'], ['demo-tech','technician','Técnico de prueba'], ['demo-client','client','Cliente de prueba']]) {
  try { await auth.getUser(uid); } catch(e) {
    if (e.code !== 'auth/user-not-found') throw e;
    await auth.createUser({ uid, email: `${role}@example.test`, password: 'Demo-Alianza-2026!', emailVerified: true, displayName: name });
  }
  const ref = db.doc(`users/${uid}`);
  if (!(await ref.get()).exists) await ref.create({ tenantId: 'empresa-demo', role, name });
}
const company = db.doc('tenants/empresa-demo');
if (!(await company.get()).exists) await company.create({ name: 'Empresa de prueba', createdAt: FieldValue.serverTimestamp() });
console.log('Emuladores preparados. Cuentas ficticias: admin@example.test, technician@example.test y client@example.test. Contraseña local: Demo-Alianza-2026!');
