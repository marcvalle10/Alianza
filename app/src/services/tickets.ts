import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { type Membership, type Ticket, type TicketRequest, type TicketStatus, validateRequest } from '../domain/tickets';
import { getFirebase } from './firebase';

function tickets(tenantId: string) { return collection(getFirebase().db, 'tenants', tenantId, 'tickets'); }
export function watchTickets(member: Membership, uid: string, next: (tickets: Ticket[]) => void, error: (error: unknown) => void) {
  const base = tickets(member.tenantId);
  const source = member.role === 'admin' ? query(base) : query(base, where(member.role === 'client' ? 'createdBy' : 'assignedTo', '==', uid));
  return onSnapshot(source, snapshot => next(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Ticket)).sort((a, b) => (b.createdAt?.toDate().getTime() ?? 0) - (a.createdAt?.toDate().getTime() ?? 0))), error);
}
export function watchTicket(tenantId: string, id: string, next: (ticket: Ticket | null) => void, error: (error: unknown) => void) {
  return onSnapshot(doc(tickets(tenantId), id), snapshot => next(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Ticket : null), error);
}
export async function createTicket(member: Membership, uid: string, request: TicketRequest, id: string) {
  const cleaned = Object.fromEntries(Object.entries(request).map(([key, value]) => [key, value.trim()])) as TicketRequest;
  const problem = validateRequest(cleaned);
  if (problem) throw new Error(problem);
  await setDoc(doc(tickets(member.tenantId), id), {
    tenantId: member.tenantId, createdBy: uid, assignedTo: null, status: 'Pendiente', request: cleaned,
    diagnosis: '', workDetail: '', result: '', finalTests: '', testReason: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}
export function newTicketId(tenantId: string) { return doc(tickets(tenantId)).id; }
export type WorkUpdate = Pick<Ticket, 'diagnosis' | 'workDetail' | 'result' | 'finalTests' | 'testReason'> & { status: TicketStatus; assignedTo?: string | null; details?: Record<string, string> };
export async function updateWork(tenantId: string, id: string, update: WorkUpdate, expectedVersion?: number | null) {
  const ref = doc(tickets(tenantId), id);
  await runTransaction(getFirebase().db, async transaction => {
    const current = await transaction.get(ref);
    if (!current.exists() || (expectedVersion !== undefined && (current.data().updatedAt?.toDate().getTime() ?? null) !== expectedVersion)) throw Object.assign(new Error('El expediente cambió.'), { code: 'record-conflict' });
    const previous = current.data();
    const completedAt = update.status === 'Concluido' ? (previous.status === 'Concluido' && previous.completedAt ? previous.completedAt : serverTimestamp()) : null;
    transaction.update(ref, { ...update, completedAt, updatedAt: serverTimestamp() });
  });
}

export type Party = 'provider' | 'client';
export type Conformity = { name: string; acceptedAt: Ticket['createdAt']; termsVersion: 'service-v1' };
export type Conformities = Partial<Record<Party, Conformity>>;
export function watchConformities(tenant: string, id: string, next: (entries: Conformities) => void, error: (e: unknown) => void) {
  return onSnapshot(collection(doc(tickets(tenant), id), 'conformities'), snap => next(Object.fromEntries(snap.docs.map(row => [row.id, row.data() as Conformity]))), error);
}
export async function acceptConformity(tenant: string, id: string, party: Party, uid: string, name: string, expectedVersion: number) {
  const db = getFirebase().db;
  const ticket = doc(tickets(tenant), id);
  await runTransaction(db, async transaction => {
    const current = await transaction.get(ticket);
    if (!current.exists() || current.data().updatedAt?.toDate().getTime() !== expectedVersion) throw Object.assign(new Error('El expediente cambió.'), { code: 'record-conflict' });
    transaction.set(doc(ticket, 'conformities', party), { uid, name: name.trim(), termsVersion: 'service-v1', acceptedAt: serverTimestamp() });
  });
}
