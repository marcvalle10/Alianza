import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { getBytes, getMetadata, ref, uploadBytes } from 'firebase/storage';
import { getFirebase } from './firebase';

export const slots = [['proposal', 'Propuesta económica'], ['before', 'ANTES'], ['after', 'DESPUÉS']] as const;
export type Slot = typeof slots[number][0];
export type Attachment = { bytes: Uint8Array<ArrayBuffer>; type: 'application/pdf' | 'image/jpeg' | 'image/png' };
export const maxAttachmentBytes = 6 * 1024 * 1024;
export const storageConfigured = () => Boolean(getFirebase().storage);

function attachmentRef(tenant: string, id: string, slot: Slot) {
  const storage = getFirebase().storage;
  if (!storage) throw new Error('El almacenamiento de archivos todavía no está configurado.');
  return ref(storage, `tenants/${tenant}/tickets/${id}/${slot}`);
}

function identify(bytes: Uint8Array<ArrayBuffer>, slot: Slot): Attachment {
  if (!bytes.length || bytes.length > maxAttachmentBytes) throw new Error('Selecciona un archivo de hasta 6 MB.');
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { bytes, type: 'image/jpeg' };
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return { bytes, type: 'image/png' };
  if (slot === 'proposal' && [37, 80, 68, 70, 45].every((value, index) => bytes[index] === value)) return { bytes, type: 'application/pdf' };
  throw new Error(slot === 'proposal' ? 'Selecciona un PDF, PNG o JPG válido.' : 'Selecciona una foto PNG o JPG válida.');
}

export async function selectAttachment(slot: Slot): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: slot === 'proposal' ? ['application/pdf', 'image/jpeg', 'image/png'] : ['image/jpeg', 'image/png'],
    copyToCacheDirectory: true, multiple: false, base64: false,
  });
  if (result.canceled) return null;
  const selected = result.assets[0];
  if (selected.file) {
    if (selected.file.size > maxAttachmentBytes) throw new Error('Selecciona un archivo de hasta 6 MB.');
    return identify(new Uint8Array(await selected.file.arrayBuffer()), slot);
  }
  const file = new File(selected.uri);
  try {
    if ((selected.size ?? file.size) > maxAttachmentBytes) throw new Error('Selecciona un archivo de hasta 6 MB.');
    return identify(new Uint8Array(await file.bytes()), slot);
  } finally {
    if (file.uri.startsWith(Paths.cache.uri) && file.exists) { try { file.delete(); } catch { /* Cache is managed by the device. */ } }
  }
}

export async function storeAttachment(tenant: string, id: string, slot: Slot, file: Attachment) {
  await uploadBytes(attachmentRef(tenant, id, slot), file.bytes, { contentType: file.type, cacheControl: 'private, no-store' });
}

export async function readAttachment(tenant: string, id: string, slot: Slot): Promise<Attachment | null> {
  try {
    const path = attachmentRef(tenant, id, slot);
    await getMetadata(path);
    return identify(new Uint8Array(await getBytes(path, maxAttachmentBytes)), slot);
  } catch (error) {
    if ((error as { code?: string }).code === 'storage/object-not-found') return null;
    throw error;
  }
}

export async function readAttachments(tenant: string, id: string) {
  if (!storageConfigured()) return {};
  const entries = await Promise.all(slots.map(async ([slot]) => [slot, await readAttachment(tenant, id, slot)] as const));
  return Object.fromEntries(entries) as Partial<Record<Slot, Attachment | null>>;
}

export function attachmentFilename(slot: Slot, file: Attachment) {
  return `${slot === 'proposal' ? 'propuesta' : slot === 'before' ? 'antes' : 'despues'}.${file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'}`;
}
