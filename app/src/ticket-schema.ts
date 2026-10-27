// Etiquetas del formato de referencia. Sin datos reales de clientes.
export type Field = { label: string; options?: string[]; multiple?: boolean };
export type Section = { title: string; fields: Field[] };
const text = (...labels: string[]): Field[] => labels.map(label => ({ label }));
export const sections: Section[] = [
  { title: 'FORMATO DE SERVICIO', fields: text('Folio', 'FECHA SOLICITUD', 'FECHA TERMINACIÓN') },
  { title: '1. DATOS DEL CLIENTE', fields: text('Empresa / cliente', 'RFC', 'No. de orden / referencia', 'Contacto responsable', 'Teléfono', 'Correo electrónico', 'Domicilio del servicio', 'Área / departamento', 'Ubicación específica') },
  { title: '2. TIPO DE SERVICIO Y PRIORIDAD', fields: [
    { label: 'Tipo de atención', multiple: true, options: ['Instalación', 'Preventivo', 'Correctivo', 'Soporte', 'Diagnóstico', 'Garantía', 'Otro'] },
    { label: 'Prioridad (marcar)', options: ['Baja', 'Normal', 'Alta', 'Urgente'] },
    { label: 'Estado del servicio', options: ['Pendiente', 'En proceso', 'Concluido', 'Requiere seguimiento'] },
  ] },
  { title: '3. EQUIPO, SISTEMA O ÁREA ATENDIDA', fields: text('Equipo / sistema', 'Marca', 'Modelo', 'No. de serie / inventario', 'Cantidad', 'Ubicación del equipo') },
  { title: '4. DIAGNÓSTICO Y SOLICITUD DEL CLIENTE', fields: text('Descripción de la falla, necesidad o alcance solicitado', 'Diagnóstico técnico / causa probable') },
  { title: '5. ACTIVIDADES REALIZADAS', fields: [
    { label: 'Actividades (marcar las aplicables)', multiple: true, options: ['Inspección / diagnóstico', 'Limpieza', 'Instalación', 'Configuración / programación', 'Pruebas de funcionamiento', 'Ajustes', 'Reparación', 'Sustitución de componentes', 'Mantenimiento preventivo', 'Mantenimiento correctivo', 'Capacitación', 'Otro'] }, ...text('Otro', 'Detalle del trabajo realizado'),
  ] },
  { title: '6. PROPUESTA ECONOMICA', fields: [
    ...text('Propuesta económica (referencia del archivo)'),
    { label: 'Evidencia fotográfica / archivos adjuntos', multiple: true, options: ['Antes', 'Después', 'Etiquetas / serie', 'Capturas / reporte', 'No aplica'] },
    ...text('Nombre o referencia de archivos / enlace / observaciones', 'ANTES (referencia)', 'DESPUES (referencia)'),
  ] },
  { title: '7. RESULTADO, PRUEBAS Y SEGUIMIENTO', fields: [
    { label: 'Resultado (marcar)', multiple: true, options: ['Funcionando correctamente', 'Servicio parcial', 'Requiere refacción', 'Requiere 2.ª visita', 'Pendiente de autorización'] },
    { label: 'Pruebas finales', options: ['Correctas', 'Con observaciones', 'No realizadas (indicar motivo)'] },
    ...text('Motivo de pruebas no realizadas', 'Observaciones y recomendaciones', 'Acción / seguimiento requerido', 'Fecha propuesta de próxima visita', 'Responsable del seguimiento'),
  ] },
  { title: '8. COSTOS DEL SERVICIO POSTERIORES (ADICIONALES) A INSTALACIÓN:', fields: [
    { label: 'Aplicabilidad de costos', options: ['NO APLICAN', 'Aplican'] },
    ...['Mano de obra', 'Materiales / refacciones', 'Traslado / otros'].flatMap(concept => text(`${concept} - Cantidad`, `${concept} - Precio unitario`, `${concept} - Importe`)),
    ...text('Subtotal', 'IVA', 'TOTAL MXN', 'Condiciones / autorización de costos'),
  ] },
  { title: '10. CONFORMIDAD Y FIRMAS', fields: ['PRESTADOR DE SERVICIO', 'USUARIO FINAL RESPONSABLE', 'USUARIO FINAL CO-RESPONSABLE 1', 'USUARIO FINAL CO-RESPONSABLE 2'].flatMap(role => text(`${role} - Nombre`, `${role} - Cargo`, `${role} - EMPRESA`, `${role} - Signature`, `${role} - Email`)) },
];
export const conformity = 'El cliente confirma la recepción del servicio descrito y manifiesta que fue informado del resultado, las observaciones y, en su caso, los trabajos pendientes. La firma acredita la visita y la recepción de la información, sin sustituir garantías o condiciones contractuales aplicables.';
