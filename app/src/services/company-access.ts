import { useEffect, useState } from 'react';
import { friendlyError } from './firebase';
import { useSession } from './session';
import { CompanyAccessError, createCompany, saveCompanyAccess, watchCompanies, watchCompanyUsers, type Company, type CompanyUser } from './users';
import type { Role } from '../domain/tickets';

export function useCompanyAccess() {
  const { canManageAccess, membership } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState('');
  const [directory, setDirectory] = useState<{ tenantId: string; people: CompanyUser[] }>();
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const tenantId = canManageAccess ? selected || membership?.tenantId || companies[0]?.id : membership?.tenantId;

  useEffect(() => {
    if (canManageAccess) return watchCompanies(setCompanies, e => setError(friendlyError(e)));
  }, [canManageAccess]);

  useEffect(() => {
    if (!tenantId || (!canManageAccess && membership?.role !== 'admin')) return;
    return watchCompanyUsers(tenantId, people => setDirectory({ tenantId, people }), e => setError(friendlyError(e)), true);
  }, [tenantId, canManageAccess, membership?.role]);

  function select(id: string) {
    setSelected(id); setUid(''); setName(''); setRole('client'); setMessage(''); setError('');
  }
  function edit(person: CompanyUser) {
    setUid(person.uid); setName(person.name); setRole(person.role); setMessage(''); setError('');
  }
  async function run(action: () => Promise<void>, success: string) {
    if (busy || !canManageAccess) return;
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(success); }
    catch (e) { setError(e instanceof CompanyAccessError ? e.message : friendlyError(e)); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!tenantId) return;
    await run(async () => {
      await saveCompanyAccess({ tenantId, uid, name, role, active: true });
      setUid(''); setName(''); setRole('client');
    }, 'Acceso guardado para esta empresa.');
  }
  async function suspend(person: CompanyUser) {
    await run(() => saveCompanyAccess({ ...person, active: false }), 'Acceso suspendido para esta empresa.');
  }
  async function addCompany() {
    await run(async () => { await createCompany(companyName); setCompanyName(''); }, 'Empresa creada.');
  }
  return {
    canManageAccess, tenantId, companies, people: directory?.tenantId === tenantId ? directory?.people : undefined,
    uid, setUid, name, setName, role, setRole, companyName, setCompanyName,
    select, edit, save, suspend, addCompany, message, error, busy,
  };
}
