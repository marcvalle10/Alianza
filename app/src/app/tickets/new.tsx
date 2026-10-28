import { useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Switch, Text, View } from 'react-native';
import { Button, Input, Page, ui } from '../../components/ui';
import { blankRequest, priorities, requestFields, serviceTypes, validateRequest } from '../../domain/tickets';
import { friendlyError } from '../../services/firebase';
import { useSession } from '../../services/session';
import { createTicket, newTicketId } from '../../services/tickets';
export default function NewTicket() {
  const { user, membership } = useSession();
  const [request, setRequest] = useState(() => blankRequest(user?.email ?? ''));
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const id = useRef<string | null>(null);
  async function save() {
    if (!membership || !user || !accepted || sending.current) return;
    const problem = validateRequest(request);
    if (problem) { setError(problem); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      id.current ??= newTicketId(membership.tenantId);
      await createTicket(membership, user.uid, request, id.current);
      router.replace({ pathname: '/tickets/[id]', params: { id: id.current } });
    } catch (e) { setError(friendlyError(e)); }
    finally { sending.current = false; setBusy(false); }
  }
  if (membership?.role === 'technician') return <Redirect href="/tickets" />;
  return <Page title="Nuevo reporte de servicio">
    <Text style={ui.notice}>Versión de prueba: utiliza datos ficticios. Este formulario inicia el reporte; las evidencias, cotización y firmas del formato completo se incorporarán después.</Text>
    {requestFields.map(([key, label, required]) => <Input key={key} label={`${label}${required ? ' *' : ' (opcional)'}`} value={request[key]} onChange={value => setRequest(r => ({ ...r, [key]: value }))} disabled={busy} multiline={key === 'description'} email={key === 'email'} />)}
    <Text style={ui.label}>Prioridad</Text><View style={ui.row}>{priorities.map(value => <Button key={value} title={value} disabled={busy} secondary={request.priority !== value} onPress={() => setRequest(r => ({ ...r, priority: value }))} />)}</View>
    <Text style={ui.label}>Tipo de atención</Text><View style={ui.row}>{serviceTypes.map(value => <Button key={value} title={value} disabled={busy} secondary={request.serviceType !== value} onPress={() => setRequest(r => ({ ...r, serviceType: value }))} />)}</View>
    <View style={ui.card}><Text>Al enviar, los campos de este reporte se guardarán en Firebase y serán visibles para el personal autorizado de tu empresa. No incluyas contraseñas ni datos sensibles.</Text><View style={ui.row}><Switch accessibilityLabel="Confirmo el envío de los datos de prueba" value={accepted} onValueChange={setAccepted} disabled={busy} /><Text>Confirmo el envío de estos datos de prueba.</Text></View></View>
    {error ? <Text style={ui.error}>{error}</Text> : null}
    <Button title={busy ? 'Enviando…' : 'Enviar reporte'} disabled={!accepted || busy} onPress={() => { void save(); }} />
    <Button title="Volver" secondary disabled={busy} onPress={() => router.replace('/tickets')} />
  </Page>;
}
