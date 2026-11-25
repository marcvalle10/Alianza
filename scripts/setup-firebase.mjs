import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i+1] : undefined; };
const projectId = option('--project'), tenantId = option('--tenant'), uid = option('--uid'), role = option('--role'), name = option('--name');
if (!projectId || !tenantId || !uid || !name || !['admin','technician','client'].includes(role) || !/^[a-zA-Z0-9_-]{1,80}$/.test(tenantId)) {
  console.error('Uso: node scripts/setup-firebase.mjs --project ID --tenant EMPRESA --uid UID_AUTH --role admin|technician|client --name "Nombre" [--apply]'); process.exit(1);
}
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST || projectId.startsWith('demo-')) throw new Error('Este comando es para un proyecto real. Para pruebas usa seed-emulators.mjs.');
if (!args.includes('--apply')) {
  console.log(JSON.stringify({ mode: 'preview', projectId, documents: [`tenants/${tenantId}`, `users/${uid}`], membership: { tenantId, role, name }, note: 'No se ha escrito nada. Usa credenciales administrativas locales y --apply para crear el perfil. No sobrescribe perfiles existentes.' }, null, 2));
  process.exit(0);
}
initializeApp({ credential: applicationDefault(), projectId });
const user = await getAuth().getUser(uid);
if (!user.emailVerified || user.disabled) throw new Error('Primero debe verificarse el correo de una cuenta activa de Authentication.');
const db = getFirestore();
await db.runTransaction(async transaction => {
  const profileRef = db.doc(`users/${uid}`), companyRef = db.doc(`tenants/${tenantId}`);
  const [profile, company] = await Promise.all([transaction.get(profileRef), transaction.get(companyRef)]);
  if (profile.exists) throw new Error('El perfil ya existe. No se sobrescribe ni cambia de empresa automáticamente.');
  if (!company.exists) transaction.create(companyRef, { name: tenantId, createdAt: FieldValue.serverTimestamp() });
  transaction.create(profileRef, { tenantId, role, name });
});
console.log(`Perfil creado en ${projectId}: users/${uid}. No se crearon tickets ni contraseñas.`);
