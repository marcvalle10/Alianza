import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useSession } from '../services/session';
import { useCompanyAccess } from '../services/company-access';
import { friendlyError, getFirebase } from '../services/firebase';
import { createTicket, newTicketId, updateWork, watchTicket, watchTickets, type WorkUpdate } from '../services/tickets';
import { watchCompanyUsers, type CompanyUser } from '../services/users';
import { blankRequest, priorities, requestFields, roles, serviceTypes, statuses, validateRequest, type Role, type Ticket, type TicketStatus } from '../domain/tickets';
import { fieldBinding, recordValues } from '../domain/record';
import { conformity, sections, type Field as SchemaField } from '../ticket-schema';
import { Choices, Field, Icon, Shell, Status, Title, roleNames } from './shared.web';
import { ConformityAction, ExportService, RecordFiles, useConformities } from './RecordFiles.web';
import { calculateCosts, normalizeCosts } from '../domain/costs';
import { privacyRequestTypes, requestPrivacyAction, type PrivacyRequest } from '../services/privacy';

type Screen = 'dashboard' | 'services' | 'new' | 'record' | 'profile' | 'users' | 'demo';
const date = (v: Ticket['createdAt']) => v ? v.toDate().toLocaleDateString('es-MX') : 'Pendiente';
export default function Portal({ screen }: { screen: Screen }) {
  const { user, membership, loading, canManageAccess } = useSession();
  if (screen === 'demo') return <Shell demo><Record demo /></Shell>;
  if (loading) return <div className="loading-page" role="status">Comprobando acceso…</div>;
  if (!user?.emailVerified || (!membership && !(canManageAccess && screen === 'users'))) return <Redirect href="/" />;
  return <Shell key={membership?.tenantId}>{screen === 'dashboard' || screen === 'services' ? <Services dashboard={screen === 'dashboard'} /> : screen === 'new' ? <NewReport /> : screen === 'record' ? <Record /> : screen === 'users' ? <Users /> : <Profile />}</Shell>;
}
function Services({ dashboard }: { dashboard: boolean }) {
  const { user, membership, memberships, selectCompany, canManageAccess, companyNames } = useSession();
  const params = useLocalSearchParams<{ status?: string }>();
  const [items, setItems] = useState<Ticket[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState(params.status || 'Todos'), [priority, setPriority] = useState('Todas');
  useEffect(() => { setFilter(params.status || 'Todos'); }, [params.status]);
  useEffect(() => { if (!membership || !user) return; return watchTickets(membership, user.uid, data => { setItems(data); setLoading(false); setError(''); }, e => { setError(friendlyError(e)); setLoading(false); }); }, [membership?.tenantId, membership?.role, user?.uid]);
  const visible = items.filter(t => (filter === 'Todos' || t.status === filter) && (priority === 'Todas' || t.request.priority === priority) && `${t.id} ${t.request.company} ${t.request.description}`.toLowerCase().includes(search.toLowerCase()));
  const open = (id: string) => router.push({ pathname: '/tickets/[id]', params: { id } });
  const create = membership?.role !== 'technician' ? <button className="primary" onClick={() => router.push('/tickets/new')}><Icon name="new" />Crear reporte</button> : null;
  return <><Title eyebrow={dashboard ? `PANEL DE ${roleNames[membership!.role].toUpperCase()}` : 'GESTIÓN DE SERVICIOS'} title={dashboard ? `Hola, ${membership?.name || 'bienvenido'}` : 'Servicios'} subtitle={dashboard ? 'Consulta el estado de tus servicios y continúa donde lo dejaste.' : `${loading ? '…' : visible.length} expedientes visibles para tu cuenta`}>{create}</Title>
    {error && <p className="error-banner" role="alert">{error}</p>}{loading && <p role="status">Cargando servicios…</p>}
    {dashboard ? <><div className="metrics">{statuses.map(status => <button className="metric" key={status} onClick={() => router.push({ pathname: '/tickets', params: { status } })}><span>{status}</span><strong>{loading ? '—' : items.filter(t => t.status === status).length}</strong><small>Servicios de tu cuenta</small><Icon name="chev" /></button>)}</div><div className="dashboard-grid"><div className="panel"><div className="panel-title"><div><h2>Atención prioritaria</h2><p>Servicios abiertos, ordenados por prioridad</p></div><button className="link" onClick={() => router.push('/tickets')}>Ver todos</button></div>{items.filter(t => t.status !== 'Concluido').sort((a,b) => priorities.indexOf(b.request.priority as typeof priorities[number]) - priorities.indexOf(a.request.priority as typeof priorities[number])).slice(0, 5).map(t => <button className="service-row" key={t.id} onClick={() => open(t.id)}><span className={`priority ${t.request.priority.toLowerCase()}`}>●</span><span><strong>{t.request.company}</strong><small>{t.request.description}</small></span><Status>{t.status}</Status><span className="date">{date(t.createdAt)}</span><Icon name="chev" /></button>)}{!loading && !items.some(t => t.status !== 'Concluido') && <div className="empty-state"><Icon name="services" /><h3>Sin servicios abiertos</h3><p>Los reportes aparecerán aquí cuando se registren.</p></div>}</div><div className="panel"><h2>Tu espacio de trabajo</h2><p className="muted">{membership?.role === 'client' ? 'Puedes crear solicitudes y consultar su seguimiento.' : membership?.role === 'technician' ? 'Aquí encontrarás los servicios que te hayan asignado.' : 'Consulta expedientes y asigna técnicos de tu empresa.'}</p><div className="notice blue"><b>Empresa activa</b>{membership && (memberships.length > 1 ? <label className="field"><span>Cambiar empresa</span><select value={membership.tenantId} onChange={event => selectCompany(event.target.value)}>{memberships.map(scope => <option key={scope.tenantId} value={scope.tenantId}>{companyNames[scope.tenantId] || scope.tenantId}</option>)}</select></label> : <p>{companyNames[membership.tenantId] || membership.tenantId}</p>)}</div>{(canManageAccess || membership?.role === 'admin') && <button className="secondary" onClick={() => router.push('/users')}>Usuarios y permisos</button>}<p className="hint">Los indicadores se calculan con los expedientes a los que tienes acceso. No incluyen datos de otras empresas.</p></div></div></> : <><div className="filter-panel"><label className="search-box"><Icon name="search" /><input aria-label="Buscar servicios" placeholder="Buscar por folio, empresa o descripción" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Estado del servicio" value={filter} onChange={e => setFilter(e.target.value)}>{['Todos', ...statuses].map(s => <option key={s}>{s}</option>)}</select><select aria-label="Prioridad" value={priority} onChange={e => setPriority(e.target.value)}><option value="Todas">Todas las prioridades</option>{priorities.map(p => <option key={p}>{p}</option>)}</select></div><div className="table-panel"><table><thead><tr><th>Folio</th><th>Empresa / servicio</th><th>Estado</th><th>Prioridad</th><th>Fecha</th><th>Detalle</th></tr></thead><tbody>{visible.map(t => <tr key={t.id}><td className="folio-cell">{t.id}</td><td><strong>{t.request.company}</strong><small>{t.request.description}</small></td><td><Status>{t.status}</Status></td><td><span className={`priority ${t.request.priority.toLowerCase()}`}>● {t.request.priority}</span></td><td>{date(t.createdAt)}</td><td><button className="link" aria-label={`Abrir reporte ${t.id}`} onClick={() => open(t.id)}>Abrir →</button></td></tr>)}</tbody></table>{visible.map(t => <button className="mobile-card" key={t.id} onClick={() => open(t.id)}><span><strong>{t.request.company}</strong><small className="folio-cell">{t.id}</small></span><Status>{t.status}</Status><p>{t.request.description}</p><footer><span>{t.request.priority}</span><span>{date(t.createdAt)}</span></footer></button>)}</div>{!loading && !visible.length && <div className="panel empty-state"><Icon name="services" /><h3>No hay reportes que mostrar</h3><p>Prueba otros filtros o crea una solicitud.</p></div>}</>}
  </>;
}
function NewReport() {
  const { user, membership } = useSession();
  const [request, setRequest] = useState(() => blankRequest(user?.email || ''));
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const sending = useRef(false), id = useRef<string | null>(null);
  if (membership?.role === 'technician') return <Redirect href="/tickets" />;
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!user || !membership || sending.current || !consent) return;
    const problem = validateRequest(request); if (problem) { setError(problem); return; }
    sending.current = true; setBusy(true); setError('');
    try { id.current ??= newTicketId(membership.tenantId); await createTicket(membership, user.uid, request, id.current); router.replace({ pathname: '/tickets/[id]', params: { id: id.current } }); } catch(e) { setError(friendlyError(e)); } finally { sending.current = false; setBusy(false); }
  }
  const fields = (from: number, to: number) => requestFields.slice(from,to).map(([key,label,required]) => <Field key={key} label={label} value={request[key]} onChange={value => setRequest(r => ({ ...r, [key]: value }))} required={required} wide={key === 'address' || key === 'description'} multiline={key === 'description'} type={key === 'email' ? 'email' : 'text'} />);
  return <><Title eyebrow="NUEVA SOLICITUD" title="Crear reporte de servicio" subtitle="Los campos marcados con * son obligatorios." /><form className="form-page" onSubmit={submit}><div className="notice blue"><b>Antes de enviar</b><p>Usa datos ficticios durante las pruebas. El expediente se guardará en Firebase y será visible para el personal autorizado de tu empresa.</p></div><fieldset disabled={busy}><h2>1. Datos del cliente</h2><div className="form-grid">{fields(0,9)}</div><h2>2. Tipo de servicio y prioridad</h2><Choices label="Tipo de atención" options={serviceTypes} value={request.serviceType} multiple onChange={serviceType => setRequest(r => ({...r,serviceType}))} /><Choices label="Prioridad" options={priorities} value={request.priority} onChange={priority => setRequest(r => ({...r,priority}))} /><h2>3. Equipo, sistema o área atendida</h2><div className="form-grid">{fields(9,15)}</div><h2>4. Solicitud del cliente</h2>{fields(15,16)}<div className="pending-sections"><b>Etapas posteriores</b><p>El diagnóstico, trabajo, propuesta, resultados y costos se completarán durante la atención del servicio.</p></div><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required /><span>Revisé la información y confirmo su envío para gestionar este servicio de prueba.</span></label></fieldset>{error && <p role="alert" className="error-banner">{error}</p>}<div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={() => router.push('/tickets')}>Cancelar</button><button type="submit" className="primary" disabled={busy || !consent}>{busy ? 'Enviando…' : 'Enviar reporte'}</button></div></form></>;
}
function Record({ demo = false }: { demo?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { membership } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(demo ? { id: 'VISTA-PREVIA', tenantId: 'empresa-demo', createdBy: '', assignedTo: null, request: blankRequest(), status: 'Pendiente', diagnosis: '', workDetail: '', result: '', finalTests: '', testReason: '', createdAt: null, updatedAt: null } : null);
  const [values, setValues] = useState<Record<string,string>>({}), [assignedTo,setAssignedTo] = useState('');
  const [people, setPeople] = useState<CompanyUser[]>([]), [busy,setBusy] = useState(false), [loading,setLoading] = useState(!demo), [error,setError] = useState(''), [message,setMessage] = useState(''), [dirty,setDirty] = useState(false), [conflict,setConflict] = useState(false);
  const loaded = useRef(false), saving = useRef(false), hasEdits = useRef(false), editBase = useRef<number | null>(null);
  const { entries, readError } = useConformities(ticket, !demo);
  const signed = Boolean(entries.provider || entries.client);
  useEffect(() => {
    if (demo) return;
    if (!membership || !id || id.includes('/')) { setLoading(false); setTicket(null); return; }
    loaded.current = false; hasEdits.current = false; setDirty(false); setConflict(false); setLoading(true);
    return watchTicket(membership.tenantId, id, t => {
      setTicket(t); setLoading(false);
      if (!t) return;
      const version = t.updatedAt?.toDate().getTime() ?? null;
      if (saving.current) { editBase.current = version; return; }
      if (!loaded.current || !hasEdits.current) {
        setValues(recordValues(t)); setAssignedTo(t.assignedTo ?? ''); loaded.current = true; editBase.current = version;
      } else if (editBase.current !== version) setConflict(true);
    }, e => { setError(friendlyError(e)); setLoading(false); setTicket(null); });
  }, [id, membership?.tenantId, demo]);
  useEffect(() => { if (!demo && membership?.role === 'admin') return watchCompanyUsers(membership.tenantId, setPeople, e => setError(friendlyError(e))); }, [membership?.role, membership?.tenantId, demo]);
  useEffect(() => { if (!dirty) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const canEdit = demo || (!signed && (membership?.role === 'admin' || membership?.role === 'technician'));
  const markDirty = () => { hasEdits.current = true; setDirty(true); setMessage(''); };
  const change = (path: string, value: string) => { setValues(v => ({ ...v, [path]: value })); markDirty(); };
  const draftDetails = Object.fromEntries(Object.entries(values).filter(([k]) => k.startsWith('details.')).map(([k,v]) => [k.slice(8),v]));
  let totals: Record<string, string> = {};
  try { totals = calculateCosts(draftDetails); } catch { /* Validation is shown on save. */ }
  function reload() { if (!ticket) return; setValues(recordValues(ticket)); setAssignedTo(ticket.assignedTo ?? ''); editBase.current = ticket.updatedAt?.toDate().getTime() ?? null; hasEdits.current = false; setDirty(false); setConflict(false); }
  async function save() {
    if (!ticket || !membership || busy || demo || conflict || signed) return;
    let details: Record<string, string>;
    try { details = Object.fromEntries(Object.entries(normalizeCosts(draftDetails)).filter(([, value]) => value.trim())); }
    catch (e) { setError((e as Error).message); return; }
    const update: WorkUpdate = { status: (values.status || ticket.status) as TicketStatus, diagnosis: values.diagnosis || '', workDetail: values.workDetail || '', result: values.result || '', finalTests: values.finalTests || '', testReason: values.testReason || '', details, ...(membership.role === 'admin' ? { assignedTo: assignedTo || null } : {}) };
    if (update.status === 'Concluido' && (!update.result.trim() || !update.finalTests || (update.finalTests === 'No realizadas (indicar motivo)' && !update.testReason.trim()))) { setError('Para concluir indica el resultado, las pruebas finales y el motivo si no se realizaron.'); return; }
    if (update.status === 'Concluido' && ticket.status !== 'Concluido' && !window.confirm('¿Confirmas que el expediente está listo para cerrar y solicitar conformidad?')) return;
    saving.current = true; setBusy(true); setError(''); try { await updateWork(membership.tenantId,ticket.id,update,editBase.current); hasEdits.current = false; setDirty(false); setConflict(false); setMessage('Cambios guardados en Firebase.'); } catch(e) { setError(friendlyError(e)); if ((e as {code?:string}).code === 'record-conflict') setConflict(true); } finally { saving.current = false; setBusy(false); }
  }
  function field(f: SchemaField, compact = false) {
    const path = fieldBinding[f.label];
    if (!path) return null;
    const calculated = path.startsWith('details.') && /Amount$|\.(subtotal|tax|total)$/.test(path);
    const read = busy || calculated || (!demo && (!canEdit || path.startsWith('request.')));
    const savedValue = values[path] || '';
    const value = calculated && canEdit && draftDetails.costApplicability === 'Aplican' ? (totals[path.slice(8)] ?? '') : savedValue || (path === 'details.taxRate' && draftDetails.costApplicability === 'Aplican' ? '16' : '');
    return <div key={f.label} className={f.options || /Descripción|Diagnóstico técnico|Detalle|Observaciones|Condiciones/.test(f.label) ? 'wide' : ''}>{f.options ? <Choices label={f.label} options={f.options} multiple={f.multiple} value={value} disabled={read} onChange={v => change(path,v)} /> : <Field label={compact ? f.label.split(' - ').at(-1)! : f.label} value={value} onChange={v => change(path,v)} read={read} multiline={/Descripción|Diagnóstico técnico|Detalle|Observaciones|Condiciones/.test(f.label)} />}</div>;
  }
  if (loading) return <p role="status">Cargando expediente…</p>;
  if (!ticket) return <><p className="error-banner" role="alert">{error || 'No se encontró el reporte o no tienes acceso.'}</p><button className="secondary" onClick={() => router.push('/tickets')}>Volver</button></>;
  return <><div className="record-top"><button className="back" onClick={() => router.push(demo ? '/' : '/tickets')}>‹ {demo ? 'Volver al acceso' : 'Servicios'}</button><div className="record-heading"><div><p className="eyebrow">FORMATO DE SERVICIO</p><h1 className="record-folio">{ticket.id}</h1><p>{ticket.request.company || 'Expediente de servicio'} · {demo ? 'Vista de diseño' : ticket.request.equipment}</p></div><div className="record-tags"><Status>{ticket.status}</Status><span className={`priority ${ticket.request.priority.toLowerCase()}`}>● {ticket.request.priority}</span></div>{canEdit && !demo && <div className="record-actions"><button className="primary" disabled={busy || !dirty || conflict} onClick={() => void save()}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>}</div></div><div className="syncbar"><span>{demo ? 'Vista previa local · no se guarda ni envía información' : dirty ? 'Tienes cambios sin guardar' : `Última actualización: ${date(ticket.updatedAt)}`}</span></div>
    {error && <p className="error-banner" role="alert">{error}</p>}{message && <p className="notice blue" role="status">{message}</p>}{conflict && <div className="notice"><b>El expediente tiene una actualización</b><p>Carga la versión más reciente antes de editar de nuevo. Se descartará la captura local.</p><button className="secondary" onClick={reload}>Cargar versión guardada</button></div>}
    {demo && <div className="notice blue"><b>Formato completo en una sola pantalla</b><p>Captura temporal para revisar el diseño. No incluye subida de archivos ni firma electrónica. Usa datos ficticios.</p></div>}
    <div className="record-layout"><aside className="record-index"><strong>Índice del expediente</strong>{sections.map((s,i) => <a key={s.title} href={`#record-${i}`}>{s.title}</a>)}<div className="ai"><b>Asistente IA</b><span>Próximamente</span><p>Sugerencias con revisión humana.</p></div></aside><div className="record-content"><section className="record-section" id="record-0"><div className="section-head"><h2>Control del servicio</h2></div><div className="form-grid"><Field label="Folio" value={ticket.id} read /><Field label="FECHA SOLICITUD" value={date(ticket.createdAt)} read /><Field label="FECHA TERMINACIÓN" value={date(ticket.completedAt ?? null)} read />{membership?.role === 'admin' && !demo && <label className="field"><span>Técnico asignado</span><select disabled={busy || signed} value={assignedTo} onChange={e => {setAssignedTo(e.target.value);markDirty();}}><option value="">Sin asignar</option>{people.filter(p => p.role === 'technician').map(p => <option key={p.uid} value={p.uid}>{p.name || p.uid}</option>)}{assignedTo && !people.some(p => p.uid === assignedTo) && <option value={assignedTo}>{assignedTo}</option>}</select></label>}</div></section>
    {sections.slice(1).map((section,index) => <section className="record-section" id={`record-${index+1}`} key={section.title}><div className="section-head"><h2>{section.title}</h2></div>
      {section.title.startsWith('6.') && !demo && <RecordFiles key={ticket.id} ticket={ticket} editable={canEdit && !busy} />}
      {section.title.startsWith('10.') ? <><div className="notice"><b>Conformidad</b><p>{conformity}</p><p>El campo Signature admite una referencia de una firma obtenida fuera de la aplicación.</p></div>{!demo && <ConformityAction key={ticket.id} ticket={ticket} entries={entries} readError={readError} />}<div className="signatures">{[0,1,2,3].map(n => <div className="signature" key={n}><b>{section.fields[n*5].label.split(' - ')[0]}</b><div className="signature-fields">{section.fields.slice(n*5,n*5+5).map(f => field(f,true))}</div></div>)}</div></> : section.title.startsWith('8.') ? <>{field(section.fields[0])}{draftDetails.costApplicability === 'Aplican' && <><div className="cost-table"><div className="cost-row head"><span>Concepto</span><span>Cantidad</span><span>Precio unitario</span><span>Importe</span></div>{['Mano de obra','Materiales / refacciones','Traslado / otros'].map((concept,n) => <div className="cost-row editable" key={concept}><span>{concept}</span>{section.fields.slice(1+n*3,4+n*3).map(f => <div key={f.label}>{field(f,true)}</div>)}</div>)}</div><div className="form-grid">{section.fields.slice(10).map(f => field(f))}</div><p className="hint">Los importes en MXN se calculan a partir de la cantidad, el precio unitario y el IVA.</p></>}</> : <div className="form-grid">{section.fields.map(f => field(f))}</div>}
    </section>)}{!demo && <ExportService ticket={ticket} entries={entries} disabled={busy || dirty || conflict || Boolean(readError)} />}</div></div></>;
}
function Users() {
  const { membership } = useSession();
  const access = useCompanyAccess();
  if (!access.canManageAccess && membership?.role !== 'admin') return <Redirect href="/dashboard" />;
  return <><Title eyebrow="ADMINISTRACIÓN" title="Usuarios y permisos" />
    {access.canManageAccess && <div className="settings-grid access-settings">
      <form className="panel" onSubmit={e => { e.preventDefault(); void access.save(); }}>
        <h2>Asignar acceso</h2>
        <p className="muted">Usa el UID que la persona recibe después de verificar su correo.</p>
        <fieldset disabled={access.busy}>
          <label className="field"><span>Empresa</span><select required value={access.tenantId || ''} onChange={e => access.select(e.target.value)}>
            <option value="" disabled>Selecciona una empresa</option>
            {access.companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select></label>
          <Field label="UID de la cuenta" value={access.uid} onChange={access.setUid} required />
          <Field label="Nombre de la persona" value={access.name} onChange={access.setName} required />
          <label className="field"><span>Rol en esta empresa</span><select value={access.role} onChange={e => access.setRole(e.target.value as Role)}>
            {roles.map(role => <option key={role} value={role}>{roleNames[role]}</option>)}
          </select></label>
          <button className="primary" disabled={!access.tenantId}>Guardar acceso</button>
        </fieldset>
      </form>
      <form className="panel" onSubmit={e => { e.preventDefault(); void access.addCompany(); }}>
        <h2>Nueva empresa</h2>
        <fieldset disabled={access.busy}>
          <Field label="Nombre de la empresa" value={access.companyName} onChange={access.setCompanyName} required />
          <button className="secondary">Crear empresa</button>
        </fieldset>
      </form>
    </div>}
    {access.error && <p className="error-banner" role="alert">{access.error}</p>}
    {access.message && <p className="notice blue" role="status">{access.message}</p>}
    {access.tenantId && <div className="panel"><h2>Accesos de la empresa</h2>
      {access.people?.map(person => <div className="access-row" key={person.uid}>
        <div><strong>{person.name || 'Perfil'}</strong><p className="muted">{roleNames[person.role]} · {person.active ? 'Activo' : 'Suspendido'}</p></div>
        {access.canManageAccess && <div className="access-buttons">
          <button className="secondary" disabled={access.busy} onClick={() => access.edit(person)}>{person.active ? 'Editar acceso' : 'Preparar reactivación'}</button>
          {person.active && <button className="secondary" disabled={access.busy} onClick={() => {
            if (window.confirm(`¿Suspender a ${person.name} en esta empresa?`)) void access.suspend(person);
          }}>Suspender</button>}
        </div>}
      </div>)}
      {!access.error && (access.people ? (!access.people.length && <p>Sin perfiles asignados.</p>) : <p role="status">Cargando perfiles…</p>)}
    </div>}
  </>;
}
function Profile() {
  const { user,membership,logout } = useSession(); const [message,setMessage] = useState(''),[error,setError] = useState(''),[busy,setBusy] = useState(false);
  const [requestType, setRequestType] = useState<PrivacyRequest>('access');
  async function submitRequest() {
    if (!user || busy || !window.confirm('¿Quieres registrar una solicitud de privacidad para revisión?')) return;
    setBusy(true); setError(''); setMessage('');
    try { setMessage(`Solicitud registrada. Folio: ${await requestPrivacyAction(user.uid, requestType)}`); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }
  return <><Title eyebrow="CUENTA" title="Perfil, seguridad y privacidad" subtitle="Consulta tu cuenta y administra el acceso." /><div className="settings-grid"><div className="panel"><h2>Información personal</h2><Field label="Nombre" value={membership?.name || ''} read /><Field label="Correo" value={user?.email || ''} read /><Field label="Empresa" value={membership?.tenantId || ''} read /><Field label="Rol" value={membership ? roleNames[membership.role] : ''} read /><p className="hint">Solicita correcciones al responsable de tu empresa.</p></div><div className="panel"><h2>Seguridad</h2><button className="setting" disabled={busy} onClick={async () => { if (!user?.email) return; setBusy(true);setError('');try { await sendPasswordResetEmail(getFirebase().auth,user.email);setMessage('Se solicitó un correo para restablecer tu contraseña.'); } catch(e) {setError(friendlyError(e));} finally {setBusy(false);} }}>Restablecer contraseña <Icon name="chev" /></button><button className="setting danger-text" onClick={() => void logout().catch(e => setError(friendlyError(e)))}>Cerrar sesión en este equipo <Icon name="chev" /></button>{message && <p role="status" className="notice blue">{message}</p>}{error && <p role="alert" className="error-banner">{error}</p>}</div><div className="panel"><h2>Privacidad de la prueba</h2><p>Los datos de acceso se procesan en Firebase Authentication y los expedientes en Firestore. Cada cuenta solo accede a los reportes permitidos por su empresa y rol.</p><p className="hint">Usa datos ficticios. El aviso definitivo y los plazos de retención requieren aprobación de Alianza para abrir el piloto.</p><label className="field"><span>Solicitud de privacidad</span><select value={requestType} onChange={e => setRequestType(e.target.value as PrivacyRequest)}>{privacyRequestTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="secondary" disabled={busy} onClick={() => void submitRequest()}>Registrar solicitud</button><p className="hint">El equipo responsable revisará la solicitud. Registrar el folio no elimina la cuenta.</p></div></div></>;
}
