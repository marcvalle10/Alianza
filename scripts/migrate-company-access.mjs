import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const [projectId, mode] = process.argv.slice(2);
if (!projectId || !/^[a-z][a-z0-9-]+$/.test(projectId) || !['--check', '--apply'].includes(mode)) {
  throw new Error('Uso: node scripts/migrate-company-access.mjs ID_PROYECTO --check|--apply');
}
initializeApp({ projectId });
const db = getFirestore();
const profiles = await db.collection('users').get();
let pending = 0;
let written = 0;

for (const profile of profiles.docs) {
  const { tenantId, role, name } = profile.data();
  if (tenantId === undefined && role === undefined) continue;
  if (typeof tenantId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(tenantId) || !['client', 'technician', 'admin'].includes(role)) {
    throw new Error('Hay un perfil legado con empresa o rol inválido. Revísalo antes de publicar las reglas.');
  }
  const tenant = db.doc(`tenants/${tenantId}`);
  const directory = tenant.collection('members').doc(profile.id);
  const index = profile.ref.collection('memberships').doc(tenantId);
  const result = await db.runTransaction(async tx => {
    const [company, member, personal] = await tx.getAll(tenant, directory, index);
    if (member.exists || personal.exists) {
      if (!member.exists || !personal.exists || !sameMembership(member.data(), personal.data())) {
        throw new Error('Hay una membresía que no coincide con su copia. Revísala antes de publicar las reglas.');
      }
      return 'ready';
    }
    if (mode === '--check') return 'pending';
    if (!company.exists) tx.create(tenant, { name: tenantId, createdAt: FieldValue.serverTimestamp() });
    const data = {
      tenantId, role, active: true,
      name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : 'Perfil de servicio',
      updatedAt: FieldValue.serverTimestamp(), updatedBy: 'legacy-migration',
    };
    tx.create(directory, data);
    tx.create(index, data);
    return 'written';
  });
  if (result === 'pending') pending++;
  if (result === 'written') written++;
}
console.log(`Perfiles revisados: ${profiles.size}. Accesos pendientes: ${pending}. Accesos migrados: ${written}.`);
if (pending) process.exitCode = 2;

function sameMembership(a, b) {
  return a.tenantId === b.tenantId && a.role === b.role && a.name === b.name
    && a.active === b.active && a.updatedBy === b.updatedBy
    && a.updatedAt?.isEqual(b.updatedAt);
}
