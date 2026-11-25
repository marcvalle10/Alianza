import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { parseMembership, type Membership } from '../domain/tickets';
import { friendlyError, getFirebase } from './firebase';
import { getCompanyName } from './users';

type Session = {
  connected: boolean; connect(): void; user: User | null;
  membership: Membership | null; memberships: Membership[]; selectCompany(tenantId: string): void;
  companyNames: Record<string, string>;
  canManageAccess: boolean; loading: boolean; error: string;
  refresh(): Promise<void>; logout(): Promise<void>;
};
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [company, setCompany] = useState('');
  const [canManageAccess, setCanManageAccess] = useState(false);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!connected) return;
    setLoading(true);
    return onAuthStateChanged(getFirebase().auth, next => {
      setMemberships([]);
      setCompany('');
      setCanManageAccess(false);
      setUser(next);
      setLoading(Boolean(next?.emailVerified));
      setError('');
    }, e => { setError(friendlyError(e)); setLoading(false); });
  }, [connected]);
  useEffect(() => {
    if (!connected || !user?.emailVerified) return;
    setLoading(true);
    const db = getFirebase().db;
    let legacy: Membership | null | undefined;
    let access: Map<string, Membership | null> | undefined;
    let manager: boolean | undefined;
    let failed = false;
    function publish() {
      if (failed || legacy === undefined || access === undefined || manager === undefined) return;
      const scopes = [...access.values()].filter((scope): scope is Membership => scope !== null);
      if (legacy && !access.has(legacy.tenantId)) scopes.push(legacy);
      scopes.sort((a, b) => a.tenantId.localeCompare(b.tenantId));
      setMemberships(scopes);
      setCompany(previous => {
        if (scopes.some(scope => scope.tenantId === previous)) return previous;
        return scopes.find(scope => scope.tenantId === legacy?.tenantId)?.tenantId ?? scopes[0]?.tenantId ?? '';
      });
      setCanManageAccess(manager);
      setError('');
      setLoading(false);
    }
    function fail(e: unknown) {
      failed = true;
      setMemberships([]);
      setCanManageAccess(false);
      setError(friendlyError(e));
      setLoading(false);
    }
    const stops = [
      onSnapshot(doc(db, 'users', user.uid), snapshot => { legacy = parseMembership(snapshot.data()); publish(); }, fail),
      onSnapshot(collection(db, 'users', user.uid, 'memberships'), snapshot => {
        access = new Map(snapshot.docs.map(entry => [entry.id, entry.data().active === true ? parseMembership({ ...entry.data(), tenantId: entry.id }) : null]));
        publish();
      }, fail),
      onSnapshot(doc(db, 'alianzaAdmins', user.uid), snapshot => { manager = snapshot.exists(); publish(); }, fail),
    ];
    return () => stops.forEach(stop => stop());
  }, [connected, user?.uid, user?.emailVerified, revision]);
  const tenantIds = memberships.map(scope => scope.tenantId).join('|');
  useEffect(() => {
    let mounted = true;
    const ids = tenantIds ? tenantIds.split('|') : [];
    void Promise.all(ids.map(async id => [id, await getCompanyName(id).catch(() => id)] as const)).then(names => {
      if (mounted) setCompanyNames(Object.fromEntries(names));
    });
    return () => { mounted = false; };
  }, [tenantIds, user?.uid]);
  async function refresh() {
    const current = getFirebase().auth.currentUser;
    if (current) { await current.reload(); await current.getIdToken(true); setUser(getFirebase().auth.currentUser); }
    setRevision(r => r + 1);
  }
  async function logout() {
    await signOut(getFirebase().auth);
    setUser(null); setMemberships([]); setCanManageAccess(false); setCompany(''); setError('');
  }
  const membership = memberships.find(scope => scope.tenantId === company) ?? memberships[0] ?? null;
  return <Context.Provider value={{
    connected, connect: () => { getFirebase(); setConnected(true); }, user, membership, memberships,
    selectCompany: setCompany, canManageAccess, companyNames, loading, error, refresh, logout,
  }}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider missing');
  return value;
}
