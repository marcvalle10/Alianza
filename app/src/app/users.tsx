import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Page, ui } from '../components/ui';
import { friendlyError } from '../services/firebase';
import { useSession } from '../services/session';
import { watchCompanyUsers, type CompanyUser } from '../services/users';

const roleNames = { admin: 'Administración', technician: 'Técnico', client: 'Cliente' };
export default function Users() {
  const { membership } = useSession();
  const [people, setPeople] = useState<CompanyUser[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (membership?.role === 'admin') return watchCompanyUsers(membership.tenantId, setPeople, e => setError(friendlyError(e)));
  }, [membership?.tenantId, membership?.role]);
  if (membership?.role !== 'admin') return <Redirect href="/dashboard" />;
  return <Page title="Usuarios y permisos"><Button title="Volver al panel" secondary onPress={() => router.replace('/dashboard')} />
    <Text style={ui.notice}>Los perfiles de {membership.tenantId} se activan desde la administración de Firebase.</Text>
    {people?.map(person => <View style={ui.card} key={person.uid}><Text style={ui.label}>{person.name || 'Perfil'}</Text><Text>{roleNames[person.role]}</Text></View>)}
    {error ? <Text style={ui.error}>{error}</Text> : people === null && <Text>Cargando perfiles…</Text>}
  </Page>;
}
