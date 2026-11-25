import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

let env;
const slot = (context, name = 'before', tenant = 'acme') => ref(context.storage(), `tenants/${tenant}/tickets/one/${name}`);
const asUser = (id, verified = true) => env.authenticatedContext(id, { email_verified: verified });
const picture = new Uint8Array([255, 216, 255, 217]);

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-alianza',
    firestore: { rules: await readFile('firestore.rules', 'utf8') }, storage: { rules: await readFile('storage.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    for (const [id, tenantId, role] of [['client','acme','client'], ['other','acme','client'], ['tech','acme','technician'], ['unassigned','acme','technician'], ['admin','acme','admin'], ['outsider','other','admin']]) {
      await setDoc(doc(db, 'users', id), { tenantId, role });
      await setDoc(doc(db, 'tenants', tenantId, 'members', id), { tenantId, role, active: true });
    }
    await setDoc(doc(db, 'tenants/acme/tickets/one'), { tenantId: 'acme', createdBy: 'client', assignedTo: 'tech', status: 'En proceso' });
  });
});

test('a second membership grants file access only for tickets assigned in that company', async () => {
  const tech = asUser('tech'), admin = asUser('outsider'), acmeAdmin = asUser('admin'), client = asUser('client');
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'tenants/other/tickets/one'), { tenantId: 'other', createdBy: 'different-client', assignedTo: null, status: 'En proceso' });
    await setDoc(doc(db, 'tenants/other/members/tech'), { tenantId: 'other', role: 'technician', active: true });
  });
  await assertSucceeds(uploadBytes(slot(tech), picture, { contentType: 'image/jpeg' }));
  await assertSucceeds(uploadBytes(slot(admin, 'before', 'other'), picture, { contentType: 'image/jpeg' }));
  for (const ctx of [tech, acmeAdmin, client]) await assertFails(getBytes(slot(ctx, 'before', 'other')));
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'tenants/other/tickets/one'), { assignedTo: 'tech' }));
  await assertSucceeds(getBytes(slot(tech, 'before', 'other')));
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'tenants/other/members/tech'), { active: false }));
  await assertFails(getBytes(slot(tech, 'before', 'other')));
  await assertSucceeds(getBytes(slot(tech)));
});
after(async () => { await env?.cleanup(); });

test('ticket attachments follow role, tenant, slot, MIME and closure rules', async () => {
  const tech = asUser('tech'), client = asUser('client'), admin = asUser('admin');
  await assertSucceeds(uploadBytes(slot(tech), picture, { contentType: 'image/jpeg' }));
  await assertSucceeds(getBytes(slot(client)));
  await assertSucceeds(getBytes(slot(admin)));
  for (const ctx of [env.unauthenticatedContext(), asUser('client', false), asUser('other'), asUser('outsider'), asUser('unassigned')]) {
    await assertFails(getBytes(slot(ctx)));
  }
  await assertFails(uploadBytes(slot(client), picture, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(slot(tech, 'unsafe'), picture, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(slot(tech, 'after'), picture, { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(slot(tech, 'after'), picture, { contentType: 'text/html' }));
  await assertFails(uploadBytes(slot(tech, 'after'), new Uint8Array(6 * 1024 * 1024 + 1), { contentType: 'image/jpeg' }));
  await assertSucceeds(uploadBytes(slot(admin, 'proposal'), new Uint8Array([37,80,68,70,45]), { contentType: 'application/pdf' }));
  await assertFails(deleteObject(slot(admin)));
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'tenants/acme/tickets/one'), { status: 'Concluido' }));
  await assertFails(uploadBytes(slot(admin), picture, { contentType: 'image/jpeg' }));
  await assertSucceeds(getBytes(slot(client)));
});
