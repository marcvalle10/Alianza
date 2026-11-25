import { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { Button, Input, ui } from './ui';
import { slots, selectAttachment, storeAttachment, readAttachment, storageConfigured, attachmentFilename, readAttachments, type Attachment, type Slot } from '../services/attachments';
import { acceptConformity, watchConformities, type Conformities, type Party } from '../services/tickets';
import { useSession } from '../services/session';
import { friendlyError } from '../services/firebase';
import { createServicePdf } from '../domain/service-pdf';
import { shareFile } from '../services/file-output';
import type { Ticket } from '../domain/tickets';
import { conformity } from '../ticket-schema';

const message = (e: unknown) => e instanceof Error && !('code' in e) ? e.message : friendlyError(e);

export function NativeFiles({ ticket, edit }: { ticket: Ticket; edit: boolean }) {
  const [selection, setSelection] = useState<{ slot: Slot; file: Attachment } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  if (!storageConfigured()) return <Text style={ui.subtitle}>El almacenamiento de archivos aún no está configurado.</Text>;

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }

  return <View style={{ gap: 12 }}>{slots.map(([slot, label]) => <View key={slot} style={{ gap: 6 }}>
    <Text style={ui.label}>{label}</Text>
    <View style={ui.row}><Button title="Abrir archivo" secondary disabled={busy} onPress={() => void run(async () => {
      const file = await readAttachment(ticket.tenantId, ticket.id, slot);
      if (!file) setNotice(`Sin archivo en ${label.toLowerCase()}.`);
      else await shareFile(file.bytes, attachmentFilename(slot, file), file.type);
    })} />
    {edit && ticket.status !== 'Concluido' && <Button title="Seleccionar" secondary disabled={busy} onPress={() => void run(async () => {
      const file = await selectAttachment(slot);
      if (file) setSelection({ slot, file });
    })} />}</View>
  </View>)}
  {selection && edit && ticket.status !== 'Concluido' && <><Text style={ui.notice}>Confirma que el archivo es pertinente y puede compartirse con las personas autorizadas de este expediente.</Text><Button title="Confirmar subida" disabled={busy} onPress={() => void run(async () => {
    await storeAttachment(ticket.tenantId, ticket.id, selection.slot, selection.file);
    setSelection(null); setNotice('Archivo guardado en Firebase.');
  })} /><Button title="Quitar selección" secondary disabled={busy} onPress={() => setSelection(null)} /></>}
  {notice ? <Text style={ui.notice}>{notice}</Text> : null}{error ? <Text style={ui.error}>{error}</Text> : null}</View>;
}

export function NativeConformities({ ticket, entries }: { ticket: Ticket; entries: Conformities }) {
  const { user, membership } = useSession();
  const [name, setName] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const party: Party | null = membership?.role === 'client' && user?.uid === ticket.createdBy ? 'client' : membership?.role === 'technician' && user?.uid === ticket.assignedTo ? 'provider' : null;
  async function confirm() {
    if (!checked || !name.trim() || name.length > 120 || !user || !party || !ticket.updatedAt || busy) return;
    setBusy(true); setError('');
    try { await acceptConformity(ticket.tenantId, ticket.id, party, user.uid, name, ticket.updatedAt.toDate().getTime()); setChecked(false); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 10 }}><Text style={ui.subtitle}>{conformity}</Text><Text>Prestador: {entries.provider?.name ?? 'Pendiente'}</Text><Text>Responsable: {entries.client?.name ?? 'Pendiente'}</Text>
    {ticket.status === 'Concluido' && party && !entries[party] && <><Input label="Tu nombre para la conformidad" value={name} onChange={setName} disabled={busy} /><View style={ui.row}><Switch accessibilityLabel="Confirmo la recepción en los términos mostrados" value={checked} onValueChange={setChecked} disabled={busy} /><Text>Confirmo la recepción.</Text></View><Button title="Registrar conformidad" disabled={!checked || !name.trim() || name.length > 120 || busy} onPress={() => Alert.alert('Confirmar conformidad', 'La primera conformidad bloquea nuevas ediciones.', [{ text: 'Cancelar' }, { text: 'Confirmar', onPress: () => void confirm() }])} /></>}
    {error ? <Text style={ui.error}>{error}</Text> : null}</View>;
}

export function useNativeConformities(ticket: Ticket | null) {
  const [entries, setEntries] = useState<Conformities>({});
  const [error, setError] = useState('');
  useEffect(() => {
    setEntries({}); setError('');
    if (!ticket) return;
    return watchConformities(ticket.tenantId, ticket.id, setEntries, e => setError(message(e)));
  }, [ticket?.id, ticket?.tenantId]);
  return { entries, error };
}

export function NativePdf({ ticket, entries, disabled }: { ticket: Ticket; entries: Conformities; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function open() {
    setBusy(true); setError('');
    try {
      const pdf = await createServicePdf(ticket, await readAttachments(ticket.tenantId, ticket.id), entries);
      await shareFile(pdf, `Servicio-${ticket.id}.pdf`, 'application/pdf');
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <View style={ui.card}><Text style={ui.label}>Documento de servicio</Text><Text style={ui.subtitle}>El documento conserva cuatro páginas. Ábrelo con una aplicación del dispositivo.</Text><Button title={busy ? 'Generando…' : 'Abrir o guardar PDF'} disabled={disabled || busy} onPress={() => void open()} />{error ? <Text style={ui.error}>{error}</Text> : null}</View>;
}
