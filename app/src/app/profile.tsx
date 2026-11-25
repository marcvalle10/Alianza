import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button, Page, ui } from '../components/ui';
import { friendlyError, getFirebase } from '../services/firebase';
import { privacyRequestTypes, requestPrivacyAction, type PrivacyRequest } from '../services/privacy';
import { useSession } from '../services/session';

export default function Profile() {
  const { user, membership, logout } = useSession();
  const [type, setType] = useState<PrivacyRequest>('access');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }
  if (!user || !membership) return <Redirect href="/" />;
  return <Page title="Perfil y seguridad">
    <Button title="Volver a inicio" secondary onPress={() => router.replace('/dashboard')} />
    <View style={ui.card}><Text style={ui.label}>{membership.name || 'Mi cuenta'}</Text><Text>{user.email}</Text><Text style={ui.subtitle}>Empresa: {membership.tenantId}</Text>
      <Button title="Restablecer contraseña" disabled={busy || !user.email} onPress={() => void run(async () => { if (user.email) { await sendPasswordResetEmail(getFirebase().auth, user.email); setNotice('Correo de recuperación solicitado.'); } })} />
      <Button title="Cerrar sesión" disabled={busy} secondary onPress={() => void run(logout)} />
    </View>
    <View style={ui.card}><Text accessibilityRole="header" style={ui.label}>Privacidad de la prueba</Text><Text style={ui.subtitle}>Usa datos ficticios. Firebase procesa el acceso, los expedientes y los archivos de las cuentas autorizadas. Puedes registrar una solicitud para revisión administrativa.</Text>
      <View style={ui.row}>{privacyRequestTypes.map(([id, label]) => <Button key={id} title={label} secondary={type !== id} disabled={busy} onPress={() => setType(id)} />)}</View>
      <Button title="Registrar solicitud" disabled={busy} onPress={() => Alert.alert('Solicitud de privacidad', 'La solicitud se guardará para revisión.', [{ text: 'Cancelar' }, { text: 'Registrar', onPress: () => void run(async () => setNotice(`Solicitud registrada. Folio: ${await requestPrivacyAction(user.uid, type)}`)) }])} />
    </View>
    {notice ? <Text style={ui.notice}>{notice}</Text> : null}{error ? <Text style={ui.error}>{error}</Text> : null}
  </Page>;
}
