import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebase } from './firebase';

export const privacyRequestTypes = [['access', 'Acceso'], ['correction', 'Rectificación'], ['deletion', 'Cancelación / eliminación'], ['opposition', 'Oposición']] as const;
export type PrivacyRequest = typeof privacyRequestTypes[number][0];

export async function requestPrivacyAction(uid: string, type: PrivacyRequest) {
  const entry = await addDoc(collection(getFirebase().db, 'users', uid, 'privacyRequests'), { type, createdAt: serverTimestamp() });
  return entry.id;
}
