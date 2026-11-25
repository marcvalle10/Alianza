import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

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
function memberRefs(db, tenant, uid) {
  return [doc(db, 'tenants', tenant, 'members', uid), doc(db, 'users', uid, 'memberships', tenant)];
}
function changeAccess(db, actor, tenant, uid, role, active = true) {
  const batch = writeBatch(db);
  for (const path of memberRefs(db, tenant, uid)) {
    batch.set(path, { tenantId: tenant, name: uid, role, active, updatedBy: actor, updatedAt: serverTimestamp() });
  }
  return batch.commit();
}
test('only Alianza managers can add companies and atomically assign or suspend company access', async () => {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'alianzaAdmins/access-manager'), {}));
  const manager = auth('access-manager'), admin = auth('admin'), technician = auth('tech');
  const company = { name: 'Empresa de prueba', createdAt: serverTimestamp() };
  await assertFails(setDoc(doc(admin, 'alianzaAdmins/admin'), {}));
  await assertFails(setDoc(doc(admin, 'tenants/another'), company));
  await assertSucceeds(setDoc(doc(manager, 'tenants/acme'), company));
  await assertSucceeds(setDoc(doc(manager, 'tenants/other'), company));
  await assertFails(getDocs(collection(admin, 'tenants')));
  await assertFails(getDoc(ref(manager)));
  await assertFails(changeAccess(admin, 'admin', 'acme', 'tech', 'admin'));
  await assertFails(changeAccess(technician, 'tech', 'other', 'tech', 'technician'));
  await assertFails(changeAccess(auth('access-manager', false), 'access-manager', 'other', 'tech', 'technician'));
  await assertFails(changeAccess(manager, 'access-manager', 'missing', 'tech', 'technician'));
  await assertFails(setDoc(memberRefs(manager, 'acme', 'tech')[0], {
    tenantId: 'acme', name: 'tech', role: 'technician', active: true, updatedBy: 'access-manager', updatedAt: serverTimestamp(),
  }));
  await assertSucceeds(changeAccess(manager, 'access-manager', 'acme', 'tech', 'technician'));
  await assertSucceeds(changeAccess(manager, 'access-manager', 'other', 'tech', 'technician'));
  await assertSucceeds(changeAccess(manager, 'access-manager', 'other', 'admin', 'admin'));
  await assertSucceeds(getDocs(collection(technician, 'users/tech/memberships')));
  await assertFails(getDocs(collection(technician, 'users/admin/memberships')));
  await assertSucceeds(getDocs(collection(admin, 'tenants/other/members')));
  await env.withSecurityRulesDisabled(ctx => setDoc(ref(ctx.firestore(), 'new', 'other'), { ...ticket(), tenantId: 'other' }));
  await assertFails(getDoc(ref(technician, 'new', 'other')));
  await assertSucceeds(updateDoc(ref(admin, 'new', 'other'), { assignedTo: 'tech', updatedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(ref(technician, 'new', 'other')));
  await assertFails(updateDoc(ref(technician, 'new', 'other'), { assignedTo: null, updatedAt: serverTimestamp() }));
  await assertSucceeds(changeAccess(manager, 'access-manager', 'acme', 'tech', 'technician', false));
  await assertFails(getDoc(ref(technician, 'assigned')));
  await assertSucceeds(getDoc(ref(technician, 'new', 'other')));
});
test('even administrators cannot rewrite original report or creator', async () => {
  for (const change of [{ createdBy: 'admin' }, { tenantId: 'other' }, { request: { ...ticket().request, company: 'Changed' } }, { createdAt: serverTimestamp() }, { extra: true }]) {
    await assertFails(updateDoc(ref(auth('admin')), { ...change, updatedAt: serverTimestamp() }));
  }
});
test('completion requires result and tests, including a reason when not tested', async () => {
  const db = auth('tech');
  await assertFails(updateDoc(ref(db, 'assigned'), { status: 'Concluido', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(db, 'assigned'), { status: 'Concluido', result: 'Reparado', finalTests: 'No realizadas (indicar motivo)', updatedAt: serverTimestamp(), completedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(ref(db, 'assigned'), { status: 'Concluido', result: 'Reparado', finalTests: 'No realizadas (indicar motivo)', testReason: 'Pendiente de suministro eléctrico', updatedAt: serverTimestamp(), completedAt: serverTimestamp() }));
});
test('invalid status and client timestamps cannot bypass work validation', async () => {
  await assertFails(updateDoc(ref(auth('admin')), { status: 'Borrado', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(auth('admin')), { diagnosis: 'test', updatedAt: new Date(0) }));
});
test('multiple service types preserve the original form choices', async () => {
  const data = ticket(); data.request.serviceType = 'Correctivo|Soporte|Diagnóstico';
  await assertSucceeds(setDoc(ref(auth('client'), 'multiple'), data));
  data.request.serviceType = 'Correctivo|Unknown';
  await assertFails(setDoc(ref(auth('client'), 'invalid'), data));
});
test('assigned staff can save complete record fields but clients cannot', async () => {
  const changes = { details: { activities: 'Inspección / diagnóstico|Limpieza', observations: 'Prueba', subtotal: '100', signer0_name: 'Técnico ficticio' }, updatedAt: serverTimestamp() };
  await assertSucceeds(updateDoc(ref(auth('tech'), 'assigned'), changes));
  await assertFails(updateDoc(ref(auth('client'), 'assigned'), changes));
  await assertFails(updateDoc(ref(auth('tech2'), 'assigned'), changes));
});
test('record extensions reject unknown fields, wrong types and excessive text', async () => {
  for (const details of [{ role: 'admin' }, { observations: 23 }, { followUp: 'x'.repeat(4001) }]) {
    await assertFails(updateDoc(ref(auth('admin')), { details, updatedAt: serverTimestamp() }));
  }
});
test('all supported detail fields can be saved in one update', async () => {
  const schema = JSON.parse(await readFile('database/schema.json', 'utf8'));
  const fields = Object.keys(schema.collections['tenants/{tenantId}/tickets/{ticketId}'].details);
  const details = Object.fromEntries(fields.map(key => [key, key === 'taxRate' ? '16' : 'Prueba']));
  await assertSucceeds(updateDoc(ref(auth('tech'), 'assigned'), { details, updatedAt: serverTimestamp() }));
});
test('admin can list tenant users but cannot enumerate other companies', async () => {
  await assertSucceeds(getDocs(query(collection(auth('admin'), 'users'), where('tenantId', '==', 'acme'))));
  await assertFails(getDocs(collection(auth('admin'), 'users')));
  await assertFails(getDocs(query(collection(auth('client'), 'users'), where('tenantId', '==', 'acme'))));
  await assertFails(getDoc(doc(auth('admin'), 'users/outsider')));
});

test('closure and authenticated conformity preserve the completed ticket', async () => {
  const staff = auth('tech'), client = auth('client'), admin = auth('admin');
  const confirmation = (db, party) => doc(ref(db, 'assigned'), 'conformities', party);
  const form = uid => ({ uid, name: 'Participante ficticio', acceptedAt: serverTimestamp(), termsVersion: 'service-v1' });
  await assertFails(setDoc(confirmation(client, 'client'), form('client')));
  const closure = { status: 'Concluido', result: 'Funcionando correctamente', finalTests: 'Correctas', updatedAt: serverTimestamp() };
  await assertFails(updateDoc(ref(staff, 'assigned'), { ...closure, completedAt: new Date(0) }));
  await assertSucceeds(updateDoc(ref(staff, 'assigned'), { ...closure, completedAt: serverTimestamp() }));
  await assertFails(setDoc(confirmation(admin, 'client'), form('admin')));
  await assertFails(setDoc(confirmation(client, 'provider'), form('client')));
  await assertSucceeds(setDoc(confirmation(staff, 'provider'), form('tech')));
  await assertSucceeds(setDoc(confirmation(client, 'client'), form('client')));
  await assertSucceeds(getDoc(confirmation(client, 'provider')));
  await assertFails(setDoc(confirmation(client, 'client'), form('client')));
  await assertFails(updateDoc(ref(admin, 'assigned'), { diagnosis: 'Cambió', updatedAt: serverTimestamp() }));
});

test('privacy requests are private, immutable and tied to the authenticated UID', async () => {
  const path = 'users/client/privacyRequests/request-one';
  await assertSucceeds(setDoc(doc(auth('client'), path), { type: 'deletion', createdAt: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(auth('client'), path)));
  await assertFails(getDoc(doc(auth('admin'), path)));
  await assertFails(setDoc(doc(auth('client'), 'users/tech/privacyRequests/request-one'), { type: 'deletion', createdAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(auth('client'), path), { type: 'access' }));
});
