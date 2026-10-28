import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { parseMembership, type Membership } from '../domain/tickets';
import { friendlyError, getFirebase } from './firebase';

type Session = { connected: boolean; connect(): void; user: User | null; membership: Membership | null; loading: boolean; error: string; refresh(): Promise<void>; logout(): Promise<void> };
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!connected) return;
    setLoading(true);
    return onAuthStateChanged(getFirebase().auth, next => {
      setMembership(null);
      setUser(next);
      setLoading(Boolean(next?.emailVerified));
      setError('');
    }, e => { setError(friendlyError(e)); setLoading(false); });
  }, [connected]);
  useEffect(() => {
    if (!connected || !user?.emailVerified) return;
    setLoading(true);
    return onSnapshot(doc(getFirebase().db, 'users', user.uid), snapshot => {
      setMembership(parseMembership(snapshot.data())); setError(''); setLoading(false);
    }, e => { setMembership(null); setError(friendlyError(e)); setLoading(false); });
  }, [connected, user?.uid, user?.emailVerified, revision]);
  async function refresh() {
    const current = getFirebase().auth.currentUser;
    if (current) { await current.reload(); await current.getIdToken(true); setUser(getFirebase().auth.currentUser); }
    setRevision(r => r + 1);
  }
  async function logout() {
    await signOut(getFirebase().auth); setUser(null); setMembership(null); setError('');
  }
  return <Context.Provider value={{ connected, connect: () => { getFirebase(); setConnected(true); }, user, membership, loading, error, refresh, logout }}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider missing');
  return value;
}
