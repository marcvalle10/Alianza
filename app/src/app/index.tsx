import { useState } from 'react';
import { Link, Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { Button, Input, Page, ui } from '../components/ui';
import { firebaseConfigured, friendlyError, getFirebase, usingEmulators } from '../services/firebase';
import { useSession } from '../services/session';

export default function Login() {
  const session = useSession();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }
  if (session.user?.emailVerified && session.membership && !session.loading) return <Redirect href="/tickets" />;
  return <Page title="Bienvenido a Alianza">
    <Text style={ui.subtitle}>Solicita un servicio y consulta su seguimiento. Acceso separado por empresa.</Text>
    {usingEmulators && <Text style={ui.notice}>Ambiente local con emuladores. Utiliza cuentas y datos ficticios.</Text>}
    {!firebaseConfigured ? <View style={ui.card}><Text style={ui.label}>Conexión pendiente</Text><Text style={ui.subtitle}>Todavía falta configurar Firebase. Puedes consultar el formato sin enviar datos.</Text><Link href="/demo" style={ui.dark}>Ver formato de servicio local</Link></View>
      : !session.connected ? <View style={ui.card}><Text style={ui.notice}>Al continuar e iniciar sesión, tu correo y contraseña se enviarán a Firebase Authentication. Los tickets se guardarán en la base del proyecto. Esta versión de pruebas no tiene un aviso de privacidad de producción aprobado: usa solo datos ficticios.</Text><Button title="Entendido, abrir acceso" onPress={() => { try { session.connect(); } catch(e) { setError(friendlyError(e)); } }} /></View>
      : session.loading ? <Text style={ui.subtitle}>Comprobando acceso…</Text>
      : session.user ? <View style={ui.card}>
        <Text style={ui.label}>{session.user.emailVerified ? 'Tu cuenta espera activación' : 'Verifica tu correo'}</Text>
        <Text style={ui.subtitle}>{session.user.emailVerified ? 'Un administrador debe asignarte una empresa y un rol. No puedes asignártelos desde la app.' : 'Abre el enlace de verificación que recibiste y pulsa Comprobar acceso. Si el correo no llegó, puedes reenviarlo.'}</Text>
        <Text selectable style={ui.subtitle}>UID: {session.user.uid}</Text>
        {!session.user.emailVerified && <Button secondary disabled={busy} title="Reenviar verificación" onPress={() => run(async () => { await sendEmailVerification(session.user!); setMessage('Correo de verificación solicitado.'); })} />}
        <Button title="Comprobar acceso" disabled={busy} onPress={() => run(session.refresh)} />
        <Button title="Cerrar sesión" secondary disabled={busy} onPress={() => run(session.logout)} />
      </View> : <View style={ui.card}>
        <Text style={ui.label}>{mode === 'login' ? 'Iniciar sesión' : 'Crear una cuenta'}</Text>
        <Input label="Correo electrónico" value={email} onChange={setEmail} email disabled={busy} />
        <Input label="Contraseña" value={password} onChange={setPassword} secure disabled={busy} />
        <Button title={busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta y verificar correo'} disabled={busy || !email.trim() || !password || (mode === 'register' && password.length < 12)} onPress={() => run(async () => {
          const auth = getFirebase().auth;
          if (mode === 'register') { const result = await createUserWithEmailAndPassword(auth, email.trim(), password); setPassword(''); await sendEmailVerification(result.user); }
          else { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }
        })} />
        {mode === 'register' && <Text style={ui.subtitle}>Mínimo 12 caracteres. La cuenta no tendrá acceso a tickets hasta verificar el correo y recibir una asignación.</Text>}
        <Button secondary disabled={busy} title={mode === 'login' ? 'Necesito una cuenta' : 'Ya tengo cuenta'} onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setPassword(''); setError(''); }} />
        <Button secondary disabled={busy || !email.trim()} title="Recuperar contraseña" onPress={() => run(async () => { try { await sendPasswordResetEmail(getFirebase().auth, email.trim()); } catch(e) { if ((e as {code?:string}).code !== 'auth/user-not-found') throw e; } setMessage('Si existe una cuenta con ese correo, recibirás las instrucciones.'); })} />
      </View>}
    {(error || session.error) && <Text accessibilityRole="alert" style={ui.error}>{error || session.error}</Text>}
    {message && <Text style={ui.notice}>{message}</Text>}
  </Page>;
}
