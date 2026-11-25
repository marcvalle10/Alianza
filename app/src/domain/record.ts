import { sections } from '../ticket-schema';
import { requestFields, type Ticket } from './tickets';

export const extraLabels: Record<string, string> = {
  activities: 'Actividades (marcar las aplicables)', otherActivity: 'Otro', quoteReference: 'Propuesta económica (referencia del archivo)',
  evidenceCategories: 'Evidencia fotográfica / archivos adjuntos', evidenceReference: 'Nombre o referencia de archivos / enlace / observaciones', beforeReference: 'ANTES (referencia)', afterReference: 'DESPUES (referencia)',
  observations: 'Observaciones y recomendaciones', followUp: 'Acción / seguimiento requerido', nextVisit: 'Fecha propuesta de próxima visita', followUpOwner: 'Responsable del seguimiento',
  costApplicability: 'Aplicabilidad de costos', laborQuantity: 'Mano de obra - Cantidad', laborUnitPrice: 'Mano de obra - Precio unitario', laborAmount: 'Mano de obra - Importe', materialsQuantity: 'Materiales / refacciones - Cantidad', materialsUnitPrice: 'Materiales / refacciones - Precio unitario', materialsAmount: 'Materiales / refacciones - Importe', travelQuantity: 'Traslado / otros - Cantidad', travelUnitPrice: 'Traslado / otros - Precio unitario', travelAmount: 'Traslado / otros - Importe', subtotal: 'Subtotal', tax: 'IVA', total: 'TOTAL MXN', costAuthorization: 'Condiciones / autorización de costos', taxRate: 'Tasa de IVA (%)',
};
const signers = ['PRESTADOR DE SERVICIO', 'USUARIO FINAL RESPONSABLE', 'USUARIO FINAL CO-RESPONSABLE 1', 'USUARIO FINAL CO-RESPONSABLE 2'];
for (const [index, signer] of signers.entries()) for (const [key, label] of Object.entries({ name: 'Nombre', position: 'Cargo', company: 'EMPRESA', reference: 'Signature', email: 'Email' })) extraLabels[`signer${index}_${key}`] = `${signer} - ${label}`;
export const detailKeys = Object.keys(extraLabels);
export const fieldBinding = Object.fromEntries([
  ...requestFields.map(([key, label]) => [label, `request.${key}`]),
  ...Object.entries(extraLabels).map(([key, label]) => [label, `details.${key}`]),
  ['Tipo de atención', 'request.serviceType'], ['Prioridad (marcar)', 'request.priority'], ['Estado del servicio', 'status'],
  ['Diagnóstico técnico / causa probable', 'diagnosis'], ['Detalle del trabajo realizado', 'workDetail'], ['Resultado (marcar)', 'result'], ['Pruebas finales', 'finalTests'], ['Motivo de pruebas no realizadas', 'testReason'],
]);
export function recordValues(ticket: Ticket): Record<string, string> {
  const value: Record<string, string> = {};
  for (const section of sections) for (const field of section.fields) {
    const path = fieldBinding[field.label];
    if (path?.startsWith('request.')) value[path] = ticket.request[path.slice(8) as keyof Ticket['request']];
    else if (path?.startsWith('details.')) value[path] = ticket.details?.[path.slice(8)] ?? '';
    else if (path) value[path] = String(ticket[path as keyof Ticket] ?? '');
  }
  return value;
}
