import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Page, ui } from '../components/ui';
import { statuses, type Ticket } from '../domain/tickets';
import { friendlyError } from '../services/firebase';
import { useSession } from '../services/session';
import { watchTickets } from '../services/tickets';

export default function Dashboard() {
  const { user, membership } = useSession();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user && membership) return watchTickets(membership, user.uid, setTickets, e => setError(friendlyError(e)));
  }, [user?.uid, membership?.tenantId, membership?.role]);
  if (!user || !membership) return <Redirect href="/" />;
  return <Page title={membership.name ? `Hola, ${membership.name}` : 'Gestión de servicios'}>
    <Text style={ui.subtitle}>Empresa activa: {membership.tenantId}</Text>
    {statuses.map(status => <View style={ui.card} key={status}><Text style={ui.label}>{status}</Text><Text style={ui.title}>{tickets?.filter(ticket => ticket.status === status).length ?? '—'}</Text><Button title={`Ver ${status.toLowerCase()}`} secondary onPress={() => router.push({ pathname: '/tickets', params: { status } })} /></View>)}
    {error ? <Text style={ui.error}>{error}</Text> : null}
    <Button title="Ver todos los servicios" onPress={() => router.push('/tickets')} />
    {membership.role !== 'technician' && <Button title="Nuevo reporte" onPress={() => router.push('/tickets/new')} />}
    {membership.role === 'admin' && <Button title="Usuarios y permisos" secondary onPress={() => router.push('/users')} />}
    <Button title="Perfil y seguridad" secondary onPress={() => router.push('/profile')} />
  </Page>;
}
