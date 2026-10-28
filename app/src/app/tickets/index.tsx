import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Input, Page, ui } from '../../components/ui';
import { type Ticket, statuses } from '../../domain/tickets';
import { friendlyError } from '../../services/firebase';
import { useSession } from '../../services/session';
import { watchTickets } from '../../services/tickets';
export default function TicketList() {
  const { user, membership, logout } = useSession();
  const [items, setItems] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  useEffect(() => {
    if (!user || !membership) return;
    setLoading(true); setItems([]); setError('');
    return watchTickets(membership, user.uid, data => { setItems(data); setLoading(false); }, e => { setError(friendlyError(e)); setLoading(false); });
  }, [user?.uid, membership?.tenantId, membership?.role]);
  const visible = items.filter(t => (filter === 'Todos' || t.status === filter) && `${t.id} ${t.request.company} ${t.request.equipment} ${t.request.description}`.toLowerCase().includes(search.toLowerCase()));
  return <Page title="Mis servicios">
    <Text style={ui.subtitle}>{membership?.role === 'admin' ? 'Administración de la empresa' : membership?.role === 'technician' ? 'Servicios asignados' : 'Solicitudes enviadas'}</Text>
    <View style={ui.row}>{membership?.role !== 'technician' && <Button title="Nuevo reporte" onPress={() => router.push('/tickets/new')} />}<Button secondary title="Cerrar sesión" onPress={() => { void logout().catch(e => setError(friendlyError(e))); }} /></View>
    <Input label="Buscar por folio, empresa, equipo o descripción" value={search} onChange={setSearch} />
    <View style={ui.row}>{['Todos', ...statuses].map(s => <Button key={s} title={s} secondary={filter !== s} onPress={() => setFilter(s)} />)}</View>
    {error ? <Text style={ui.error}>{error}</Text> : null}
    {loading ? <Text>Cargando servicios…</Text> : !visible.length ? <Text>No hay servicios que coincidan.</Text> : null}
    {visible.map(ticket => <View style={ui.card} key={ticket.id}><Text style={ui.label}>{ticket.request.company} · {ticket.status}</Text><Text>{ticket.request.equipment}</Text><Text numberOfLines={3}>{ticket.request.description}</Text><Text style={ui.subtitle}>Folio: {ticket.id}</Text><Link href={{ pathname: '/tickets/[id]', params: { id: ticket.id } }}>Ver servicio</Link></View>)}
  </Page>;
}
