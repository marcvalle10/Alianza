import { useEffect, useState } from 'react';
import type { Ticket } from '../domain/tickets';
import { attachmentFilename, readAttachment, readAttachments, selectAttachment, slots, storageConfigured, storeAttachment, type Attachment, type Slot } from '../services/attachments';
import { friendlyError } from '../services/firebase';
import { acceptConformity, watchConformities, type Conformities, type Party } from '../services/tickets';
import { createServicePdf } from '../domain/service-pdf';
import { useSession } from '../services/session';

const message = (e: unknown) => e instanceof Error && !('code' in e) ? e.message : friendlyError(e);

function useObjectUrl(bytes?: Uint8Array<ArrayBuffer>, mime?: string) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!bytes) { setUrl(''); return; }
    const value = URL.createObjectURL(new Blob([bytes], { type: mime }));
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [bytes, mime]);
  return url;
}

function FileSlot({ ticket, slot, label, editable }: { ticket: Ticket; slot: Slot; label: string; editable: boolean }) {
  const [stored, setStored] = useState<Attachment | null>(null);
  const [selected, setSelected] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [enlarged, setEnlarged] = useState(false);
  const [consulted, setConsulted] = useState(false);
  const url = useObjectUrl(stored?.bytes, stored?.type);
  async function load() {
    setBusy(true); setError('');
    try { setStored(await readAttachment(ticket.tenantId, ticket.id, slot)); setConsulted(true); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  async function select() {
    setError('');
    try { const file = await selectAttachment(slot); if (file) setSelected(file); }
    catch (e) { setError(message(e)); }
  }
  async function upload() {
    if (!selected) return;
    setBusy(true); setError('');
    try { await storeAttachment(ticket.tenantId, ticket.id, slot, selected); setStored(selected); setSelected(null); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <article className="attachment-card"><h3>{label}</h3>
    {stored?.type.startsWith('image/') && url && <button className="attachment-image-button" onClick={() => setEnlarged(!enlarged)} aria-expanded={enlarged}><img className={enlarged ? 'expanded' : ''} src={url} alt={`Evidencia ${label.toLowerCase()}`} /></button>}
    <div className="attachment-actions"><button className="secondary" disabled={busy} onClick={() => void load()}>{busy ? 'Procesando…' : 'Consultar archivo'}</button>
      {stored && url && <a className="secondary" download={attachmentFilename(slot, stored)} href={url}>Descargar original</a>}
      {editable && <button className="secondary" disabled={busy} onClick={() => void select()}>Seleccionar archivo</button>}</div>
    {selected && <div className="attachment-selection"><p>Seleccionado en este equipo. Confirma que es pertinente y que puede compartirse con las personas autorizadas del expediente.</p><button className="primary" disabled={!editable || busy} onClick={() => void upload()}>Confirmar subida</button> <button className="link" disabled={busy} onClick={() => setSelected(null)}>Quitar selección</button></div>}
    {stored ? <p className="hint">Archivo disponible en el expediente</p> : consulted && <p className="hint">Todavía no hay archivo en este apartado.</p>}
    {error && <p role="alert" className="error-banner">{error}</p>}
  </article>;
}

export function RecordFiles({ ticket, editable }: { ticket: Ticket; editable: boolean }) {
  if (!storageConfigured()) return <p className="hint">La carga de archivos estará disponible al conectar el bucket de Firebase.</p>;
  return <div className="attachment-grid" aria-label="Archivos de servicio">{slots.map(([slot, label]) => <FileSlot key={slot} ticket={ticket} slot={slot} label={label} editable={editable && ticket.status !== 'Concluido'} />)}</div>;
}

export function useConformities(ticket: Ticket | null, enabled: boolean) {
  const [entries, setEntries] = useState<Conformities>({});
  const [readError, setReadError] = useState('');
  useEffect(() => {
    setEntries({}); setReadError('');
    if (!enabled || !ticket) return;
    return watchConformities(ticket.tenantId, ticket.id, setEntries, e => setReadError(message(e)));
  }, [enabled, ticket?.tenantId, ticket?.id]);
  return { entries, readError };
}

export function ConformityAction({ ticket, entries, readError }: { ticket: Ticket; entries: Conformities; readError: string }) {
  const { user, membership } = useSession();
  const [name, setName] = useState('');
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const party: Party | null = user?.uid === ticket.createdBy && membership?.role === 'client' ? 'client' : user?.uid === ticket.assignedTo && membership?.role === 'technician' ? 'provider' : null;
  const summary = (key: Party) => {
    const entry = entries[key];
    return entry ? `${entry.name} · ${entry.acceptedAt?.toDate().toLocaleString('es-MX') || 'Confirmando fecha'}` : 'Pendiente';
  };
  async function submit() {
    if (!party || !checked || !name.trim() || !user || !ticket.updatedAt || busy) return;
    setBusy(true); setError('');
    try { await acceptConformity(ticket.tenantId, ticket.id, party, user.uid, name, ticket.updatedAt.toDate().getTime()); setSaved(true); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <div className="notice blue"><b>Conformidad por cuenta verificada</b>
    <p>Prestador: {summary('provider')} · Responsable: {summary('client')}</p>
    {ticket.status !== 'Concluido' ? <p>El registro de conformidad se habilita al concluir el servicio.</p> : party && !entries[party] && !saved && !readError ? <><p>Revisa todo el expediente. La primera conformidad registrada bloquea nuevas ediciones.</p><label className="field"><span>Tu nombre para la conformidad</span><input value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label><label className="consent"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /> Confirmo la recepción en los términos mostrados.</label><button className="primary" disabled={!checked || !name.trim() || busy} onClick={() => void submit()}>Registrar conformidad</button></> : null}
    {saved && <p role="status">Conformidad registrada en Firebase.</p>}
    {(error || readError) && <p role="alert" className="error-banner">{error || readError}</p>}
    <p>Los co-responsables conservan sus bloques en el formato. Su autenticación individual se validará en el piloto.</p>
  </div>;
}

export function ExportService({ ticket, entries, disabled }: { ticket: Ticket; entries: Conformities; disabled: boolean }) {
  const [pdf, setPdf] = useState<Uint8Array<ArrayBuffer>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const url = useObjectUrl(pdf, 'application/pdf');
  useEffect(() => { setPdf(undefined); }, [ticket.updatedAt, entries]);
  async function generate() {
    setError(''); setPdf(undefined); setBusy(true);
    try { setPdf(await createServicePdf(ticket, await readAttachments(ticket.tenantId, ticket.id), entries)); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <section className="record-section" aria-label="Documento de servicio"><div className="section-head"><h2>Documento de servicio</h2></div><p>Vista previa del expediente guardado en cuatro páginas. La propuesta completa queda adjunta al PDF cuando existe.</p><button className="primary" disabled={busy || disabled} onClick={() => void generate()}>{busy ? 'Generando documento…' : 'Generar vista previa'}</button>
    {url && !disabled && <div className="pdf-preview"><a className="secondary" download={`Servicio-${ticket.id}.pdf`} href={url}>Descargar PDF</a><iframe title="Vista previa del formato de servicio" src={url} /></div>}
    {error && <p role="alert" className="error-banner">{error}</p>}
  </section>;
}
