import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Input, Page, ui } from '../../components/ui';
import { requestFields, statuses, type Ticket } from '../../domain/tickets';
import { friendlyError } from '../../services/firebase';
import { useSession } from '../../services/session';
import { updateWork, watchTicket, type WorkUpdate } from '../../services/tickets';
export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { membership } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [work, setWork] = useState<WorkUpdate | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!membership || !id || id.includes('/')) { setError('Folio no válido.'); setLoading(false); return; }
    setTicket(null); setWork(null); setError(''); setLoading(true);
    return watchTicket(membership.tenantId, id, value => {
      setTicket(value); setLoading(false);
      setWork(previous => previous ?? (value ? { status: value.status, assignedTo: value.assignedTo, diagnosis: value.diagnosis, workDetail: value.workDetail, result: value.result, finalTests: value.finalTests, testReason: value.testReason } : null));
    }, e => { setTicket(null); setWork(null); setError(friendlyError(e)); setLoading(false); });
  }, [id, membership?.tenantId]);
  async function save() {
    if (!membership || !work || busy) return;
    if (work.status === 'Concluido' && (!work.result.trim() || !work.finalTests || (work.finalTests === 'No realizadas (indicar motivo)' && !work.testReason.trim()))) { setError('Para concluir indica resultado, pruebas finales y, si no se realizaron, el motivo.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const { assignedTo, ...common } = work;
      await updateWork(membership.tenantId, id, { ...common, ...(membership.role === 'admin' ? { assignedTo: assignedTo?.trim() || null } : {}) });
      setMessage('Cambios guardados.');
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }
  return <Page title="Reporte de servicio">
    <Button title="Volver a servicios" secondary onPress={() => router.replace('/tickets')} />
    {error ? <Text style={ui.error}>{error}</Text> : null}
    {loading ? <Text>Cargando…</Text> : !ticket ? <Text>No se encontró el servicio o no tienes acceso.</Text> : <>
      <Text selectable style={ui.subtitle}>Folio: {ticket.id}</Text><Text style={ui.label}>{ticket.status}</Text>
      <View style={ui.card}>{requestFields.map(([key, label]) => <View key={key}><Text style={ui.label}>{label}</Text><Text>{ticket.request[key] || 'Sin capturar'}</Text></View>)}<Text>{ticket.request.serviceType} · Prioridad {ticket.request.priority}</Text></View>
      {membership?.role === 'client' ? <View style={ui.card}><Text style={ui.label}>Avance del trabajo</Text><Text>Diagnóstico: {ticket.diagnosis || 'Pendiente'}</Text><Text>Trabajo: {ticket.workDetail || 'Pendiente'}</Text><Text>Resultado: {ticket.result || 'Pendiente'}</Text><Text>Pruebas finales: {ticket.finalTests || 'Pendiente'}</Text>{ticket.testReason ? <Text>Motivo: {ticket.testReason}</Text> : null}</View> : work ? <View style={ui.card}>
        <Text style={ui.label}>Procesamiento del servicio</Text>
        {membership?.role === 'admin' ? <Input label="UID del técnico asignado (opcional)" value={work.assignedTo ?? ''} onChange={value => setWork(w => w && ({ ...w, assignedTo: value }))} disabled={busy} /> : null}
        <View style={ui.row}>{statuses.map(status => <Button key={status} title={status} secondary={work.status !== status} disabled={busy} onPress={() => setWork(w => w && ({ ...w, status }))} />)}</View>
        {([['diagnosis', 'Diagnóstico técnico / causa probable'], ['workDetail', 'Detalle del trabajo realizado'], ['result', 'Resultado final'], ['testReason', 'Motivo de pruebas no realizadas']] as const).map(([key, label]) => <Input key={key} label={label} value={work[key]} multiline disabled={busy} onChange={value => setWork(w => w && ({ ...w, [key]: value }))} />)}
        <Text style={ui.label}>Pruebas finales</Text><View style={ui.row}>{['Correctas', 'Con observaciones', 'No realizadas (indicar motivo)'].map(finalTests => <Button key={finalTests} title={finalTests} disabled={busy} secondary={work.finalTests !== finalTests} onPress={() => setWork(w => w && ({ ...w, finalTests }))} />)}</View>
        {message ? <Text style={ui.notice}>{message}</Text> : null}<Button title={busy ? 'Guardando…' : 'Guardar avance'} disabled={busy} onPress={() => { void save(); }} />
      </View> : null}
    </>}
  </Page>;
}
