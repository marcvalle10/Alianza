export const roles = ['client', 'technician', 'admin'] as const;
export type Role = typeof roles[number];
export type Membership = { tenantId: string; role: Role; name: string };
export const statuses = ['Pendiente', 'En proceso', 'Concluido', 'Requiere seguimiento'] as const;
export type TicketStatus = typeof statuses[number];
export const priorities = ['Baja', 'Normal', 'Alta', 'Urgente'] as const;
export const serviceTypes = ['Instalación', 'Preventivo', 'Correctivo', 'Soporte', 'Diagnóstico', 'Garantía', 'Otro'];
export const requestFields = [
  ['company', 'Empresa / cliente', true], ['rfc', 'RFC', false], ['order', 'No. de orden / referencia', false],
  ['contact', 'Contacto responsable', true], ['phone', 'Teléfono', false], ['email', 'Correo electrónico', true],
  ['address', 'Domicilio del servicio', false], ['department', 'Área / departamento', false], ['location', 'Ubicación específica', false],
  ['equipment', 'Equipo / sistema', true], ['brand', 'Marca', false], ['model', 'Modelo', false],
  ['serial', 'No. de serie / inventario', false], ['quantity', 'Cantidad', false], ['equipmentLocation', 'Ubicación del equipo', false],
  ['description', 'Descripción de la falla, necesidad o alcance solicitado', true],
] as const;
export type RequestField = typeof requestFields[number][0];
export type TicketRequest = Record<RequestField, string> & { priority: string; serviceType: string };
export type Ticket = {
  id: string; tenantId: string; createdBy: string; assignedTo: string | null;
  status: TicketStatus; request: TicketRequest; diagnosis: string; workDetail: string;
  result: string; finalTests: string; testReason: string;
  createdAt: { toDate(): Date } | null; updatedAt: { toDate(): Date } | null;
};
export function blankRequest(email = ''): TicketRequest {
  return { ...Object.fromEntries(requestFields.map(([key]) => [key, ''])), email, priority: 'Normal', serviceType: 'Soporte' } as TicketRequest;
}
export function validateRequest(value: TicketRequest): string | null {
  for (const [key, label, required] of requestFields) {
    if (required && !value[key]?.trim()) return `Completa ${label}.`;
    if (typeof value[key] !== 'string' || value[key].length > 4000) return `${label}: máximo 4000 caracteres.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) return 'Revisa el correo de contacto.';
  if (!priorities.some(p => p === value.priority)) return 'Selecciona una prioridad válida.';
  if (!serviceTypes.includes(value.serviceType)) return 'Selecciona un tipo de atención válido.';
  return null;
}
export function parseMembership(data: unknown): Membership | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  return typeof m.tenantId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(m.tenantId) && roles.some(r => r === m.role)
    ? { tenantId: m.tenantId, role: m.role as Role, name: typeof m.name === 'string' ? m.name : '' } : null;
}
