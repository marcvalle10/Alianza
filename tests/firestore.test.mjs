import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

let env;
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-alianza', firestore: { rules: await readFile('firestore.rules', 'utf8') } }); });
after(async () => { await env?.cleanup(); });
const auth = (uid, verified = true) => env.authenticatedContext(uid, { email: `${uid}@example.test`, email_verified: verified }).firestore();
const ref = (db, id = 'one', tenant = 'acme') => doc(db, 'tenants', tenant, 'tickets', id);
function ticket() {
  return { tenantId: 'acme', createdBy: 'client', assignedTo: null, status: 'Pendiente',
    request: { company: 'Empresa de prueba', rfc: '', order: '', contact: 'Contacto ficticio', phone: '', email: 'client@example.test', address: '', department: '', location: '', equipment: 'Equipo de prueba', brand: '', model: '', serial: '', quantity: '', equipmentLocation: '', description: 'Prueba de atención', priority: 'Normal', serviceType: 'Soporte' },
    diagnosis: '', workDetail: '', result: '', finalTests: '', testReason: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    for (const [uid, tenantId, role] of [['client','acme','client'], ['client2','acme','client'], ['tech','acme','technician'], ['tech2','acme','technician'], ['admin','acme','admin'], ['outsider','other','admin'], ['outsideTech','other','technician']]) {
      await setDoc(doc(db, 'users', uid), { tenantId, role, name: uid });
    }
    await setDoc(ref(db), ticket());
    await setDoc(ref(db, 'assigned'), { ...ticket(), assignedTo: 'tech' });
  });
});
test('verified client creates and reads own request', async () => {
  await assertSucceeds(setDoc(ref(auth('client'), 'new'), ticket()));
  await assertSucceeds(getDoc(ref(auth('client'))));
});
test('anonymous, unverified and unprovisioned users cannot read or create', async () => {
  for (const db of [env.unauthenticatedContext().firestore(), auth('client', false), auth('waiting')]) {
    await assertFails(getDoc(ref(db)));
    await assertFails(setDoc(ref(db, 'bad'), ticket()));
  }
});
test('client only queries own tickets and cannot read another client', async () => {
  const db = auth('client');
  await assertSucceeds(getDocs(query(collection(db, 'tenants/acme/tickets'), where('createdBy', '==', 'client'))));
  await assertFails(getDocs(collection(db, 'tenants/acme/tickets')));
  await assertFails(getDoc(ref(auth('client2'))));
});
test('roles and tenant membership cannot be assigned by the app', async () => {
  await assertSucceeds(getDoc(doc(auth('client'), 'users/client')));
  await assertFails(getDoc(doc(auth('client'), 'users/admin')));
  for (const uid of ['client','admin']) {
    await assertFails(updateDoc(doc(auth(uid), 'users', uid), { role: 'admin', tenantId: 'other' }));
    await assertFails(setDoc(doc(auth(uid), 'users/new-user'), { role: 'admin', tenantId: 'acme' }));
  }
});
test('cannot forge creator, tenant, timestamps or extra sensitive fields', async () => {
  for (const change of [{ createdBy: 'admin' }, { tenantId: 'other' }, { createdAt: new Date(0) }, { assignedTo: 'tech' }, { status: 'Concluido' }, { password: 'not-allowed' }]) {
    await assertFails(setDoc(ref(auth('client'), 'bad'), { ...ticket(), ...change }));
  }
});
test('server rejects malformed, oversized and missing request fields', async () => {
  for (const change of [{ company: '' }, { description: 'x'.repeat(4001) }, { priority: 'invalid' }, { email: 'invalid' }, { rfc: 25 }, { hidden: 'no' }]) {
    await assertFails(setDoc(ref(auth('client'), 'bad'), { ...ticket(), request: { ...ticket().request, ...change } }));
  }
  const missing = ticket(); delete missing.request.contact;
  await assertFails(setDoc(ref(auth('client'), 'bad'), missing));
});
test('tenant administrators cannot read or modify other companies', async () => {
  await assertFails(getDoc(ref(auth('outsider'))));
  await assertFails(updateDoc(ref(auth('outsider')), { status: 'En proceso', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref(auth('client'), 'bad', 'other'), { ...ticket(), tenantId: 'other' }));
});
test('only assigned technician can read and update work', async () => {
  await assertSucceeds(getDoc(ref(auth('tech'), 'assigned')));
  await assertSucceeds(getDocs(query(collection(auth('tech'), 'tenants/acme/tickets'), where('assignedTo', '==', 'tech'))));
  await assertFails(getDoc(ref(auth('tech'))));
  await assertFails(getDoc(ref(auth('tech2'), 'assigned')));
  await assertSucceeds(updateDoc(ref(auth('tech'), 'assigned'), { status: 'En proceso', diagnosis: 'Diagnóstico ficticio', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(auth('tech2'), 'assigned'), { status: 'En proceso', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref(auth('tech'), 'new'), { ...ticket(), createdBy: 'tech' }));
});
test('clients cannot update and no app role can delete reports', async () => {
  await assertFails(updateDoc(ref(auth('client')), { status: 'En proceso', updatedAt: serverTimestamp() }));
  for (const uid of ['client','tech','admin']) await assertFails(deleteDoc(ref(auth(uid), 'assigned')));
});
test('admin assigns only technicians within the company; technicians cannot reassign', async () => {
  await assertSucceeds(updateDoc(ref(auth('admin')), { assignedTo: 'tech', updatedAt: serverTimestamp() }));
  for (const assignedTo of ['outsideTech','client','missing']) await assertFails(updateDoc(ref(auth('admin')), { assignedTo, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(auth('tech')), { assignedTo: 'tech2', updatedAt: serverTimestamp() }));
});
test('even administrators cannot rewrite original report or creator', async () => {
  for (const change of [{ createdBy: 'admin' }, { tenantId: 'other' }, { request: { ...ticket().request, company: 'Changed' } }, { createdAt: serverTimestamp() }, { extra: true }]) {
    await assertFails(updateDoc(ref(auth('admin')), { ...change, updatedAt: serverTimestamp() }));
  }
});
test('completion requires result and tests, including a reason when not tested', async () => {
  const db = auth('tech');
  await assertFails(updateDoc(ref(db, 'assigned'), { status: 'Concluido', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(db, 'assigned'), { status: 'Concluido', result: 'Reparado', finalTests: 'No realizadas (indicar motivo)', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(ref(db, 'assigned'), { status: 'Concluido', result: 'Reparado', finalTests: 'No realizadas (indicar motivo)', testReason: 'Pendiente de suministro eléctrico', updatedAt: serverTimestamp() }));
});
test('invalid status and client timestamps cannot bypass work validation', async () => {
  await assertFails(updateDoc(ref(auth('admin')), { status: 'Borrado', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(auth('admin')), { diagnosis: 'test', updatedAt: new Date(0) }));
});
