import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getFirebase } from './firebase';
import { parseMembership, type Membership } from '../domain/tickets';
export type CompanyUser = Membership & { uid: string };
export function watchCompanyUsers(tenantId: string, next: (users: CompanyUser[]) => void, error: (error: unknown) => void) {
  return onSnapshot(query(collection(getFirebase().db, 'users'), where('tenantId', '==', tenantId)), snapshot => next(snapshot.docs.flatMap(d => { const member = parseMembership(d.data()); return member ? [{ ...member, uid: d.id }] : []; })), error);
}
