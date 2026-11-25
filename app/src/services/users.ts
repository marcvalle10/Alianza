import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { getFirebase } from './firebase';
import { parseMembership, type Membership } from '../domain/tickets';
export type CompanyUser = Membership & { uid: string; active: boolean };
export type Company = { id: string; name: string };
export class CompanyAccessError extends Error {}

export async function getCompanyName(tenantId: string) {
  const company = await getDoc(doc(getFirebase().db, 'tenants', tenantId));
  const name = company.data()?.name;
  return typeof name === 'string' && name.trim() ? name : tenantId;
}

export function watchCompanyUsers(tenantId: string, next: (users: CompanyUser[]) => void, error: (error: unknown) => void, includeInactive = false) {
  return onSnapshot(collection(getFirebase().db, 'tenants', tenantId, 'members'), snapshot => {
    const people = snapshot.docs.flatMap(entry => {
      const data = entry.data();
      const membership = parseMembership({ ...data, tenantId });
      return membership && (includeInactive || data.active === true)
        ? [{ ...membership, uid: entry.id, active: data.active === true }] : [];
    });
    next(people.sort((a, b) => a.name.localeCompare(b.name)));
  }, error);
}

export function watchCompanies(next: (companies: Company[]) => void, error: (error: unknown) => void) {
  return onSnapshot(collection(getFirebase().db, 'tenants'), snapshot => {
    const companies = snapshot.docs.map(entry => ({ id: entry.id, name: String(entry.data().name || entry.id) }));
    next(companies.sort((a, b) => a.name.localeCompare(b.name)));
  }, error);
}

export async function createCompany(name: string) {
  const clean = name.trim();
  if (!clean || clean.length > 120) throw new CompanyAccessError('Captura un nombre de empresa de hasta 120 caracteres.');
  await setDoc(doc(collection(getFirebase().db, 'tenants')), { name: clean, createdAt: serverTimestamp() });
}

export async function saveCompanyAccess(member: CompanyUser) {
  const { db, auth } = getFirebase();
  const name = member.name.trim();
  const uid = member.uid.trim();
  if (!auth.currentUser) throw new CompanyAccessError('Inicia sesión para administrar accesos.');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || !name || name.length > 120) {
    throw new CompanyAccessError('Verifica el UID y captura el nombre de la persona, hasta 120 caracteres.');
  }
  const batch = writeBatch(db);
  const data = {
    tenantId: member.tenantId, role: member.role, active: member.active, name,
    updatedBy: auth.currentUser.uid, updatedAt: serverTimestamp(),
  };
  batch.set(doc(db, 'tenants', member.tenantId, 'members', uid), data);
  batch.set(doc(db, 'users', uid, 'memberships', member.tenantId), data);
  await batch.commit();
}
