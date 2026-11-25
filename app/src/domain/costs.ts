export const costRows = [
  ['labor', 'Mano de obra'], ['materials', 'Materiales / refacciones'], ['travel', 'Traslado / otros'],
] as const;

function number(value: string, label: string, max: number) {
  if (!value.trim()) return 0;
  const raw = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) > max) throw new Error(`${label}: ingresa un número válido, con hasta dos decimales.`);
  return Number(raw);
}

export function calculateCosts(details: Record<string, string>): Record<string, string> {
  if (details.costApplicability !== 'Aplican') return {};
  const rate = number(details.taxRate || '16', 'Tasa de IVA', 100);
  const output: Record<string, string> = { taxRate: String(rate) };
  let subtotal = 0;
  for (const [key, label] of costRows) {
    const quantity = number(details[`${key}Quantity`] || '', `${label} · cantidad`, 10000);
    const price = number(details[`${key}UnitPrice`] || '', `${label} · precio unitario`, 100000);
    const amount = Math.round(Math.round(quantity * 100) * Math.round(price * 100) / 100);
    output[`${key}Amount`] = (amount / 100).toFixed(2);
    subtotal += amount;
  }
  const tax = Math.round(subtotal * Math.round(rate * 100) / 10000);
  return { ...output, subtotal: (subtotal / 100).toFixed(2), tax: (tax / 100).toFixed(2), total: ((subtotal + tax) / 100).toFixed(2) };
}

export function normalizeCosts(details: Record<string, string>): Record<string, string> {
  if (details.costApplicability === 'Aplican') return { ...details, ...calculateCosts(details) };
  if (details.costApplicability !== 'NO APLICAN') return details;
  const cleared = { ...details, subtotal: '', tax: '', total: '', taxRate: '', costAuthorization: '' };
  for (const [key] of costRows) Object.assign(cleared, { [`${key}Quantity`]: '', [`${key}UnitPrice`]: '', [`${key}Amount`]: '' });
  return cleared;
}
