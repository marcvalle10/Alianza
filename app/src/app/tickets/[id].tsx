import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { Button, Input, Page, ui } from '../../components/ui';
import { NativeConformities, NativeFiles, NativePdf, useNativeConformities } from '../../components/RecordActions';
import { calculateCosts, normalizeCosts } from '../../domain/costs';
import { recordValues, fieldBinding } from '../../domain/record';
import type { Ticket, TicketStatus } from '../../domain/tickets';
import { friendlyError } from '../../services/firebase';
import { useSession } from '../../services/session';
import { updateWork, watchTicket, type WorkUpdate } from '../../services/tickets';
import { watchCompanyUsers, type CompanyUser } from '../../services/users';
import { sections, type Field } from '../../ticket-schema';

export default function TicketDetail() {
  const { membership } = useSession();
  return <TicketDetailContent key={membership?.tenantId} />;
}

function TicketDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { membership } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [assigned, setAssigned] = useState('');
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const draft = useRef(false);
  const saving = useRef(false);
  const version = useRef<number | null>(null);
  const { entries, error: conformityError } = useNativeConformities(ticket);
  const canEdit = (membership?.role === 'technician' || membership?.role === 'admin') && !entries.client && !entries.provider;
  const details = Object.fromEntries(Object.entries(values).filter(([key]) => key.startsWith('details.')).map(([key, value]) => [key.slice(8), value]));
  let totals: Record<string, string> = {};
  try { totals = calculateCosts(details); } catch { /* Shown when saving. */ }

  function load(current: Ticket) {
    setValues(recordValues(current)); setAssigned(current.assignedTo ?? '');
    version.current = current.updatedAt?.toDate().getTime() ?? null;
    draft.current = false; setDirty(false);
  }

  useEffect(() => {
    if (!membership || !id || id.includes('/')) { setLoading(false); return; }
    draft.current = false; setTicket(null); setLoading(true); setError('');
    return watchTicket(membership.tenantId, id, current => {
      setTicket(current); setLoading(false);
      if (!current) return;
      if (saving.current) version.current = current.updatedAt?.toDate().getTime() ?? null;
      else if (!draft.current) load(current);
    }, e => { setTicket(null); setError(friendlyError(e)); setLoading(false); });
  }, [id, membership?.tenantId]);
  useEffect(() => {
    if (membership?.role === 'admin') return watchCompanyUsers(membership.tenantId, setUsers, e => setError(friendlyError(e)));
  }, [membership?.role, membership?.tenantId]);

  function change(path: string, value: string) {
    setValues(current => ({ ...current, [path]: value })); draft.current = true; setDirty(true); setMessage('');
  }
  function field(item: Field) {
    const path = fieldBinding[item.label];
    if (!path) return null;
    const calculated = /Amount$|\.(subtotal|tax|total)$/.test(path);
    const value = calculated && canEdit && details.costApplicability === 'Aplican' ? (totals[path.slice(8)] ?? '') :
      values[path] || (path === 'details.taxRate' && details.costApplicability === 'Aplican' ? '16' : '');
    const readonly = busy || !canEdit || calculated || path.startsWith('request.');
    if (readonly) return <View key={item.label}><Text style={ui.label}>{item.label}</Text><Text style={ui.subtitle}>{value.replaceAll('|', ', ') || 'Sin capturar'}</Text></View>;
    if (!item.options) return <Input key={item.label} label={item.label} value={value} onChange={next => change(path, next)} multiline={/Descripción|Detalle|Observaciones|Diagnóstico técnico/.test(item.label)} />;
    return <View key={item.label}><Text style={ui.label}>{item.label}</Text><View style={ui.row}>{item.options.map(option => {
      const chosen = value.split('|').includes(option);
      return <Button key={option} title={chosen ? '✓ ' + option : option} secondary={!chosen} onPress={() => change(path,
        item.multiple ? (chosen ? value.split('|').filter(x => x !== option) : [...value.split('|').filter(Boolean), option]).join('|') : option)} />;
    })}</View></View>;
  }
  async function save() {
    if (!ticket || !membership || !canEdit || saving.current) return;
    const status = (values.status || ticket.status) as TicketStatus;
    const work: WorkUpdate = { status, diagnosis: values.diagnosis || '', workDetail: values.workDetail || '',
      result: values.result || '', finalTests: values.finalTests || '', testReason: values.testReason || '',
      ...(membership.role === 'admin' ? { assignedTo: assigned || null } : {}) };
    if (status === 'Concluido' && (!work.result.trim() || !work.finalTests || (work.finalTests === 'No realizadas (indicar motivo)' && !work.testReason.trim()))) {
      setError('Para concluir incluye resultado, pruebas y el motivo cuando no se realizaron.'); return;
    }
    try { work.details = Object.fromEntries(Object.entries(normalizeCosts(details)).filter(([, value]) => value.trim())); }
    catch (e) { setError((e as Error).message); return; }
    saving.current = true; setBusy(true); setError('');
    try {
      await updateWork(ticket.tenantId, ticket.id, work, version.current);
      draft.current = false; setDirty(false); setMessage('Cambios guardados en Firebase.');
    } catch (e) { setError(friendlyError(e)); }
    finally { saving.current = false; setBusy(false); }
  }
  const askSave = () => values.status === 'Concluido' && ticket?.status !== 'Concluido'
    ? Alert.alert('Concluir servicio', 'Confirma que el expediente está listo.', [{ text: 'Cancelar' }, { text: 'Concluir', onPress: () => void save() }])
    : void save();
  return <Page title="Expediente de servicio">
    <Button title="Volver a servicios" secondary onPress={() => router.replace('/tickets')} />
    {loading ? <Text>Cargando…</Text> : !ticket ? <Text>{error || 'Servicio no disponible.'}</Text> : <>
      <View style={ui.card}><Text selectable style={ui.label}>{ticket.id}</Text><Text>{ticket.status} · {ticket.request.priority}</Text>
        <Text style={ui.subtitle}>Fecha solicitud: {ticket.createdAt?.toDate().toLocaleDateString('es-MX') || 'Pendiente'}</Text><Text style={ui.subtitle}>Fecha terminación: {ticket.completedAt?.toDate().toLocaleDateString('es-MX') || 'Pendiente'}</Text>
        {membership?.role === 'admin' && canEdit && <><Text style={ui.label}>Técnico asignado</Text><View style={ui.row}>{[{ uid: '', name: 'Sin asignar' }, ...users.filter(user => user.role === 'technician')].map(user => <Button key={user.uid} title={user.name || user.uid} disabled={busy} secondary={assigned !== user.uid} onPress={() => { setAssigned(user.uid); draft.current = true; setDirty(true); }} />)}</View></>}
      </View>
      {sections.slice(1).map((section, index) => <View key={section.title} style={ui.card}><Text accessibilityRole="header" style={ui.label}>{section.title}</Text>
        {index === 5 && <NativeFiles key={ticket.id} ticket={ticket} edit={canEdit && !busy} />}
        {index === 8 && <NativeConformities key={ticket.id} ticket={ticket} entries={entries} />}
        {(index === 7 && details.costApplicability !== 'Aplican' ? section.fields.slice(0, 1) : section.fields).map(field)}
      </View>)}
      {(error || conformityError) ? <Text accessibilityRole="alert" style={ui.error}>{error || conformityError}</Text> : null}
      {message ? <Text style={ui.notice}>{message}</Text> : null}
      {canEdit && <Button title={busy ? 'Guardando…' : 'Guardar cambios'} disabled={busy || !dirty} onPress={askSave} />}
      {dirty && <Button title="Cargar versión guardada" secondary disabled={busy} onPress={() => load(ticket)} />}
      <NativePdf ticket={ticket} entries={entries} disabled={dirty || busy || Boolean(conformityError)} />
    </>}
  </Page>;
}
