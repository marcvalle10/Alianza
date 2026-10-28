import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
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
export type WorkUpdate = Pick<Ticket, 'diagnosis' | 'workDetail' | 'result' | 'finalTests' | 'testReason'> & { status: TicketStatus; assignedTo?: string | null };
export async function updateWork(tenantId: string, id: string, update: WorkUpdate) {
  await updateDoc(doc(tickets(tenantId), id), { ...update, updatedAt: serverTimestamp() });
}
