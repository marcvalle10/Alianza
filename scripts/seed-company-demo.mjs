import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Catálogo ficticio inspirado en las categorías de servicio de las prácticas.
// Los nombres de clientes, costos, fechas y resultados son ejemplos.
const examples = [
  { id: '01', company: 'Planta industrial Norte', equipment: 'Cableado estructurado', type: 'Instalación', priority: 'Alta', status: 'Pendiente', description: 'Solicitud de ampliación de nodos de datos en una oficina de operaciones.', department: 'Operaciones' },
  { id: '02', company: 'Centro empresarial del Valle', equipment: 'Puntos de acceso inalámbrico', type: 'Diagnóstico', priority: 'Normal', status: 'Pendiente', description: 'Revisión de cobertura y conectividad inalámbrica en áreas de trabajo.', department: 'Sistemas' },
  { id: '03', company: 'Oficinas Horizonte', equipment: 'Sistema de audio', type: 'Instalación', priority: 'Baja', status: 'Pendiente', description: 'Solicitar una propuesta de instalación de audio para sala de reuniones.', department: 'Administración' },
  { id: '04', company: 'Planta industrial Norte', equipment: 'Sistema de videoconferencia', type: 'Soporte', priority: 'Urgente', status: 'Pendiente', description: 'Revisar problemas de audio reportados durante reuniones de prueba.', department: 'Comunicaciones' },
  { id: '05', company: 'Centro logístico del Pacífico', equipment: 'Fibra óptica y site', type: 'Instalación', priority: 'Alta', status: 'En proceso', description: 'Integración de conectividad de datos en un nuevo espacio técnico.', diagnosis: 'Pendiente de verificación final del enlace de muestra.', work: 'Se documentó el alcance y se preparó el inventario simulado.', activities: 'Instalación|Inspección / diagnóstico', department: 'Infraestructura' },
  { id: '06', company: 'Manufactura Sierra', equipment: 'Gabinete de comunicaciones', type: 'Correctivo', priority: 'Normal', status: 'En proceso', description: 'Reorganización de un gabinete y revisión de sus conexiones.', diagnosis: 'El orden de conexiones requiere revisión en el escenario de prueba.', work: 'Se inició la revisión documental de los componentes del gabinete.', activities: 'Inspección / diagnóstico|Ajustes', department: 'Sistemas' },
  { id: '07', company: 'Corporativo Altavista', equipment: 'Control de acceso', type: 'Preventivo', priority: 'Alta', status: 'En proceso', description: 'Mantenimiento preventivo general de equipos de acceso.', diagnosis: 'Se requiere inspección programada de los equipos.', work: 'Se preparó una lista de revisión para el mantenimiento ficticio.', activities: 'Mantenimiento preventivo|Inspección / diagnóstico', department: 'Mantenimiento' },
  { id: '08', company: 'Servicios del Desierto', equipment: 'NAS y respaldos', type: 'Soporte', priority: 'Alta', status: 'En proceso', description: 'Revisión del estado de respaldos y almacenamiento de equipos de oficina.', diagnosis: 'Se requiere comprobar los reportes de respaldos de la demostración.', work: 'Se inició la revisión de inventario y tareas programadas de ejemplo.', activities: 'Inspección / diagnóstico|Configuración / programación', department: 'TI' },
  { id: '09', company: 'Oficinas Horizonte', equipment: 'Videoconferencia y audio', type: 'Instalación', priority: 'Normal', status: 'Concluido', description: 'Integración de equipos audiovisuales en sala de reuniones ficticia.', diagnosis: 'Solicitud de integración de imagen y sonido.', work: 'Se registró una instalación de ejemplo con pruebas simuladas de audio y video.', activities: 'Instalación|Pruebas de funcionamiento', result: 'Funcionando correctamente', tests: 'Correctas', department: 'Comunicaciones', labor: '2', price: '650' },
  { id: '10', company: 'Manufactura Sierra', equipment: 'Canalización y nodos de red', type: 'Instalación', priority: 'Alta', status: 'Concluido', description: 'Reubicación de canalización y extensión de cableado para una ampliación de oficina.', diagnosis: 'Se requiere adaptar una canalización ficticia.', work: 'Se documentó la terminación de la actividad de ejemplo y su revisión visual.', activities: 'Instalación|Ajustes', result: 'Funcionando correctamente', tests: 'Correctas', department: 'Infraestructura', labor: '4', price: '450' },
  { id: '11', company: 'Servicios del Desierto', equipment: 'Equipos portátiles', type: 'Preventivo', priority: 'Baja', status: 'Concluido', description: 'Mantenimiento preventivo de un lote ficticio de equipos de cómputo.', diagnosis: 'Actividad de mantenimiento programada.', work: 'Se ejemplificó el registro de limpieza y revisión funcional.', activities: 'Limpieza|Mantenimiento preventivo', result: 'Funcionando correctamente', tests: 'Correctas', department: 'TI', labor: '3', price: '300' },
  { id: '12', company: 'Centro empresarial del Valle', equipment: 'Conectividad inalámbrica', type: 'Correctivo', priority: 'Normal', status: 'Concluido', description: 'Atención de una solicitud de conectividad en áreas administrativas.', diagnosis: 'Incidencia de conectividad ficticia.', work: 'Se completó el escenario de atención y se documentó la comprobación de ejemplo.', activities: 'Inspección / diagnóstico|Pruebas de funcionamiento', result: 'Funcionando correctamente', tests: 'Correctas', department: 'Sistemas' },
  { id: '13', company: 'Centro logístico del Pacífico', equipment: 'Sistema de videovigilancia', type: 'Soporte', priority: 'Alta', status: 'Requiere seguimiento', description: 'Revisión de un servicio de videovigilancia de demostración.', diagnosis: 'Queda pendiente una validación funcional.', work: 'Se registró la inspección general de ejemplo.', activities: 'Inspección / diagnóstico', result: 'Requiere 2.ª visita', tests: 'Con observaciones', follow: 'Programar revisión funcional con el responsable de prueba.', department: 'Soporte' },
  { id: '14', company: 'Corporativo Altavista', equipment: 'Sistema de detección de incendio', type: 'Preventivo', priority: 'Alta', status: 'Requiere seguimiento', description: 'Solicitud de mantenimiento documentado de equipos de prevención.', diagnosis: 'Se requiere revisión por personal responsable.', work: 'Se ejemplificó el registro de inspección, sin certificación técnica.', activities: 'Inspección / diagnóstico|Mantenimiento preventivo', result: 'Requiere 2.ª visita', tests: 'No realizadas (indicar motivo)', testReason: 'Caso de demostración, la validación se dejó para otra visita.', follow: 'Coordinar evaluación con personal autorizado.', department: 'Mantenimiento' },
  { id: '15', company: 'Planta industrial Norte', equipment: 'Enlace de telecomunicaciones', type: 'Diagnóstico', priority: 'Normal', status: 'Requiere seguimiento', description: 'Revisión general del alcance de un enlace de comunicaciones ficticio.', diagnosis: 'Falta confirmar el alcance de trabajo.', work: 'Se registraron observaciones para una visita posterior.', activities: 'Inspección / diagnóstico', result: 'Pendiente de autorización', tests: 'Con observaciones', follow: 'Solicitar autorización del alcance de demostración.', department: 'Comunicaciones' },
  { id: '16', company: 'Manufactura Sierra', equipment: 'Terminal de registro de asistencia', type: 'Garantía', priority: 'Normal', status: 'Requiere seguimiento', description: 'Seguimiento de garantía de un equipo de registro de asistencia ficticio.', diagnosis: 'La revisión de garantía está pendiente.', work: 'Se abrió el seguimiento documental de ejemplo.', activities: 'Inspección / diagnóstico', result: 'Requiere refacción', tests: 'Con observaciones', follow: 'Confirmar disponibilidad de refacción de demostración.', department: 'Administración' },
];

const [project, tenantId, creator, mode] = process.argv.slice(2);
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const local = project === 'demo-alianza' && tenantId === 'empresa-demo'
  && /^127\.0\.0\.1:\d+$/.test(emulator || '');
const pilot = project === 'alianza-a1bc3' && tenantId === 'alianza-informatica' && !emulator;
if ((!local && !pilot) || !/^[a-zA-Z0-9_-]{1,128}$/.test(creator || '') || !['--check', '--apply'].includes(mode)) {
  throw new Error('Uso: node scripts/seed-company-demo.mjs PROYECTO EMPRESA UID_ADMIN --check|--apply. Solo permite el piloto Alianza y el emulador local.');
}

initializeApp({ projectId: project });
const db = getFirestore();
const company = db.doc(`tenants/${tenantId}`);
const [tenant, admin] = await db.getAll(company, company.collection('members').doc(creator));
if (!tenant.exists || admin.get('active') !== true || admin.get('role') !== 'admin') {
  throw new Error('La empresa debe existir y el creador debe tener una membresía administrativa activa.');
}

function ticketData(example, index) {
  const days = 2 + index;
  const createdAt = Timestamp.fromMillis(Date.now() - days * 86400000);
  const updatedAt = Timestamp.fromMillis(createdAt.toMillis() + 3600000);
  const data = {
    tenantId, createdBy: creator, assignedTo: null, status: example.status,
    request: {
      company: `DEMO · ${example.company}`, rfc: '', order: `DEMO-${example.id}`,
      contact: 'Contacto ficticio de servicio', phone: '', email: 'contacto@alianza-demo.example.test',
      address: '', department: example.department, location: 'Área de demostración',
      equipment: example.equipment, brand: '', model: '', serial: '', quantity: '', equipmentLocation: '',
      description: `[DEMO] ${example.description}`, priority: example.priority, serviceType: example.type,
    },
    diagnosis: example.diagnosis || '', workDetail: example.work || '',
    result: example.result || '', finalTests: example.tests || '', testReason: example.testReason || '',
    createdAt, updatedAt, completedAt: example.status === 'Concluido' ? updatedAt : null,
  };
  if (example.status !== 'Pendiente') {
    data.details = {
      activities: example.activities || '',
      observations: 'Expediente ficticio para demostración académica. Fechas, resultados y costos son ilustrativos.',
      followUp: example.follow || '',
      followUpOwner: example.follow ? 'Responsable de prueba' : '',
      costApplicability: 'NO APLICAN',
    };
    if (example.labor) {
      const subtotal = Number(example.labor) * Number(example.price);
      const tax = Math.round(subtotal * 16) / 100;
      Object.assign(data.details, {
        costApplicability: 'Aplican', laborQuantity: example.labor, laborUnitPrice: example.price,
        laborAmount: subtotal.toFixed(2), materialsAmount: '0.00', travelAmount: '0.00',
        taxRate: '16', subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: (subtotal + tax).toFixed(2),
        costAuthorization: 'Estimación ficticia para mostrar el cálculo.',
      });
    }
  }
  return data;
}

// IDs fijos para que repetir el comando no duplique ni sobrescriba expedientes.
const refs = examples.map(example => company.collection('tickets').doc(`demo-alianza-${example.id}`));
const summary = await db.runTransaction(async tx => {
  const snapshots = await tx.getAll(...refs);
  let present = 0;
  let inserted = 0;
  for (let i = 0; i < refs.length; i++) {
    const snapshot = snapshots[i];
    if (snapshot.exists) {
      if (snapshot.get('tenantId') !== tenantId || !snapshot.get('request.description')?.startsWith('[DEMO]')) {
        throw new Error(`El folio reservado ${refs[i].id} está ocupado por un expediente distinto. No se modificó nada.`);
      }
      present++;
    } else if (mode === '--apply') {
      tx.create(refs[i], ticketData(examples[i], i));
      inserted++;
    }
  }
  return { present, inserted, pending: examples.length - present - inserted };
});
console.log(JSON.stringify({ company: tenantId, ...summary, total: examples.length }));
await db.terminate();
