// The standalone build keeps the library's TypeScript helpers together on Metro.
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib/dist/pdf-lib.min.js';
import { conformity, sections, type Field } from '../ticket-schema';
import { recordValues, fieldBinding } from './record';
import type { Ticket } from './tickets';
import type { Attachment, Slot } from '../services/attachments';
import type { Conformities } from '../services/tickets';
import { costRows } from './costs';

const ink = rgb(.08, .20, .28);
const blue = rgb(.10, .34, .48);
const rule = rgb(.55, .65, .71);
const pale = rgb(.94, .96, .97);
const white = rgb(1, 1, 1);
const left = 44;
const right = 568;
const pageWidth = right - left;
const date = (value?: Ticket['createdAt']) => value ? value.toDate().toLocaleDateString('es-MX') : 'Pendiente';
const money = (value?: string) => value && Number.isFinite(Number(value)) ? `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value || '';

export async function createServicePdf(ticket: Ticket, attachments: Partial<Record<Slot, Attachment | null>>, signatures: Conformities) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Formato de servicio ${ticket.id}`);
  doc.setAuthor('Alianza Informática');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const values = recordValues(ticket);
  let needsTextAttachment = false;

  function compatible(text: string, face: PDFFont) {
    return Array.from(text.replace(/\t/g, ' ')).map(character => {
      try { face.encodeText(character); return character; }
      catch { needsTextAttachment = true; return '?'; }
    }).join('');
  }

  function draw(page: PDFPage, value: string, x: number, y: number, size = 9, face = font, color = ink) {
    page.drawText(compatible(value, face), { x, y, size, font: face, color });
  }

  function wrap(value: string, max: number, size: number) {
    const lines: string[] = [];
    for (const paragraph of value.split(/\r?\n/).map(line => compatible(line, font))) {
      let line = '';
      for (const character of paragraph) {
        if (line && font.widthOfTextAtSize(line + character, size) > max) {
          const lastSpace = line.lastIndexOf(' ');
          if (lastSpace > 0) { lines.push(line.slice(0, lastSpace)); line = line.slice(lastSpace + 1); }
          else { lines.push(line); line = ''; }
        }
        line += character;
      }
      lines.push(line);
    }
    return lines;
  }

  function block(page: PDFPage, value: string, x: number, y: number, width: number, maxLines: number, size = 8.4) {
    const lines = wrap(value || '—', width, size);
    if (lines.length > maxLines) {
      needsTextAttachment = true;
      lines[maxLines - 1] = 'Continúa en el texto adjunto al PDF.';
    }
    lines.slice(0, maxLines).forEach((entry, index) => draw(page, entry, x, y - index * (size + 2.4), size));
  }

  function page(number: number) {
    const p = doc.addPage([612, 792]);
    draw(p, `ALIANZA INFORMÁTICA   |   Formato interno de control de servicio   |   ${number} / 4`, 110, 27, 7);
    return p;
  }

  function section(p: PDFPage, title: string, y: number) {
    draw(p, title, left, y, 9.4, bold);
    p.drawLine({ start: { x: left, y: y - 6 }, end: { x: right, y: y - 6 }, color: blue, thickness: .85 });
  }

  function fieldValue(field: Field) {
    const key = fieldBinding[field.label];
    const value = values[key] || '';
    if (!field.options) return value;
    const choices = value.split('|');
    const custom = choices.filter(choice => choice && !field.options?.includes(choice));
    return [...field.options.map(option => `${choices.includes(option) ? '[X]' : '[ ]'} ${option}`), ...custom].join('   ');
  }

  function cells(p: PDFPage, data: [string, string][], top: number, columns: number, height = 36, maxLines = 2) {
    const width = pageWidth / columns;
    data.forEach(([label, value], index) => {
      const x = left + index % columns * width;
      const y = top - Math.floor(index / columns) * height;
      p.drawRectangle({ x, y: y - height, width, height, borderWidth: .45, borderColor: rule });
      p.drawRectangle({ x: x + .3, y: y - 13, width: width - .6, height: 12.7, color: pale });
      draw(p, label, x + 5, y - 9.6, 7.4, bold);
      block(p, value, x + 5, y - 23, width - 10, maxLines);
    });
  }

  async function exhibit(p: PDFPage, slot: Slot, x: number, y: number, width: number, height: number) {
    const file = attachments[slot];
    if (!file) {
      p.drawRectangle({ x, y, width, height, color: pale, borderWidth: .5, borderColor: rule });
      draw(p, 'Sin archivo registrado', x + 12, y + height / 2, 9);
      return;
    }
    const stem = slot === 'proposal' ? 'Propuesta' : slot === 'before' ? 'Antes' : 'Despues';
    const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
    await doc.attach(file.bytes, `${stem}.${extension}`, { mimeType: file.type });
    let source;
    if (file.type === 'application/pdf') {
      const original = await PDFDocument.load(file.bytes);
      if (original.getPageCount() < 1) throw new Error('La propuesta PDF no contiene páginas.');
      [source] = await doc.embedPdf(original, [0]);
      draw(p, `Vista de la primera página. Propuesta original adjunta (${original.getPageCount()} páginas).`, x, y - 10, 7.5);
    } else {
      source = file.type === 'image/png' ? await doc.embedPng(file.bytes) : await doc.embedJpg(file.bytes);
    }
    const factor = Math.min(width / source.width, height / source.height);
    const fit = { x: x + (width - source.width * factor) / 2, y: y + (height - source.height * factor) / 2,
      width: source.width * factor, height: source.height * factor };
    if (file.type === 'application/pdf') p.drawPage(source as Awaited<ReturnType<PDFDocument['embedPage']>>, fit);
    else p.drawImage(source as Awaited<ReturnType<PDFDocument['embedPng']>>, fit);
  }

  const first = page(1);
  first.drawRectangle({ x: left, y: 705, width: pageWidth, height: 49, color: ink });
  draw(first, 'ALIANZA INFORMÁTICA', left + 8, 730, 17, bold, white);
  draw(first, 'SERVICIO TÉCNICO | INSTALACIÓN | MANTENIMIENTO | SOPORTE', left + 8, 714, 7, font, white);
  draw(first, 'FORMATO DE SERVICIO', 439, 735, 9, bold, white);
  draw(first, `Folio: ${ticket.id}`, 414, 718, 8, font, white);
  draw(first, `FECHA SOLICITUD: ${date(ticket.createdAt)}`, left, 691, 8);
  draw(first, `FECHA TERMINACIÓN: ${date(ticket.completedAt)}`, 385, 691, 8);

  const row = (index: number) => sections[index].fields.map(field => [field.label, fieldValue(field)] as [string, string]);
  section(first, sections[1].title, 669); cells(first, row(1), 657, 3, 36);
  section(first, sections[2].title, 533); cells(first, row(2), 521, 3, 68, 4);
  section(first, sections[3].title, 437); cells(first, row(3), 425, 3, 36);
  section(first, sections[4].title, 335); cells(first, row(4), 323, 1, 51, 3);
  section(first, sections[5].title, 205); cells(first, row(5).slice(0, 2), 193, 1, 39, 2);
  cells(first, row(5).slice(2), 115, 1, 62, 4);

  const second = page(2);
  section(second, sections[6].title, 739);
  await exhibit(second, 'proposal', left + 6, 404, pageWidth - 12, 317);
  cells(second, row(6).slice(0, 3), 385, 1, 32, 1);
  draw(second, 'ANTES:', left, 274, 9, bold);
  block(second, values['details.beforeReference'], left, 260, pageWidth, 2);
  await exhibit(second, 'before', left + 6, 58, pageWidth - 12, 183);

  const third = page(3);
  draw(third, 'DESPUES:', left, 747, 9, bold);
  block(third, values['details.afterReference'], left, 732, pageWidth, 2);
  await exhibit(third, 'after', left + 6, 526, pageWidth - 12, 185);
  section(third, sections[7].title, 504);
  const result = row(7);
  cells(third, result.slice(0, 2), 492, 2, 56, 3);
  cells(third, result.slice(2), 436, 2, 39, 2);
  section(third, sections[8].title, 301);
  draw(third, values['details.costApplicability'] || 'Sin capturar', left, 283, 9, bold);
  const costDetails = ticket.details ?? {};
  const headers = ['Concepto', 'Cantidad', 'Precio unitario', 'Importe'];
  const widths = [216, 72, 118, 118];
  const costTable = [headers, ...costRows.map(([key, label]) => [label, costDetails[`${key}Quantity`] || '', money(costDetails[`${key}UnitPrice`]), money(costDetails[`${key}Amount`])])];
  costTable.forEach((entries, index) => {
    let x = left;
    entries.forEach((entry, column) => {
      const y = 262 - index * 22;
      third.drawRectangle({ x, y: y - 15, width: widths[column], height: 22, color: index === 0 ? blue : pale, borderWidth: .4, borderColor: rule });
      draw(third, entry, x + 5, y - 6, 8, index === 0 ? bold : font, index === 0 ? white : ink);
      x += widths[column];
    });
  });
  cells(third, [['Subtotal', money(costDetails.subtotal)], [`IVA${costDetails.taxRate ? ` (${costDetails.taxRate}%)` : ''}`, money(costDetails.tax)], ['TOTAL MXN', money(costDetails.total)]], 171, 3, 35);
  cells(third, [['Condiciones / autorización de costos', costDetails.costAuthorization || '']], 127, 1, 65, 4);

  const fourth = page(4);
  section(fourth, sections[9].title, 746);
  block(fourth, conformity, left, 725, pageWidth, 6, 9);
  for (let index = 0; index < 4; index += 1) {
    const x = left + index % 2 * 266;
    const top = 658 - Math.floor(index / 2) * 253;
    const fieldGroup = sections[9].fields.slice(index * 5, index * 5 + 5);
    const signature = index === 0 ? signatures.provider : index === 1 ? signatures.client : undefined;
    fourth.drawRectangle({ x, y: top - 203, width: 248, height: 203, borderColor: rule, borderWidth: .5 });
    draw(fourth, fieldGroup[0].label.split(' - ')[0], x + 9, top - 19, 8.5, bold);
    fieldGroup.forEach((field, offset) => {
      const label = field.label.split(' - ').at(-1)!;
      const value = offset === 3 && signature ? `Conformidad registrada: ${signature.name} · ${date(signature.acceptedAt)}` : fieldValue(field);
      draw(fourth, label, x + 9, top - 40 - offset * 33, 8, bold);
      block(fourth, value, x + 9, top - 52 - offset * 33, 230, 2, 7.7);
    });
  }
  if (needsTextAttachment) {
    const complete = [`FORMATO DE SERVICIO ${ticket.id}`, `Solicitud: ${date(ticket.createdAt)}`, `Terminación: ${date(ticket.completedAt)}`,
      ...sections.slice(1).flatMap(s => [s.title, ...s.fields.map(f => `${f.label}: ${values[fieldBinding[f.label]] || ''}`)]), conformity].join('\n');
    const escaped = encodeURIComponent(complete);
    const utf8 = Uint8Array.from(escaped.match(/%[\da-f]{2}|./gi) ?? [], part => part[0] === '%' ? Number.parseInt(part.slice(1), 16) : part.charCodeAt(0));
    await doc.attach(utf8, 'Expediente-completo.txt', { mimeType: 'text/plain' });
    draw(fourth, 'Se adjunta el texto completo si algún campo excede el espacio del formato.', left, 66, 8);
  }
  return new Uint8Array(await doc.save());
}
