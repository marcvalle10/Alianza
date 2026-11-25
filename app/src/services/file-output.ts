import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareFile(bytes: Uint8Array, name: string, mimeType: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('El sistema no ofrece una aplicación para abrir el archivo.');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  try {
    file.write(bytes);
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Abrir o guardar archivo' });
  } finally {
    if (file.exists) { try { file.delete(); } catch { /* Cache is managed by the device. */ } }
  }
}
