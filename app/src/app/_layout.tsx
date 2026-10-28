import { Stack } from 'expo-router';
import { SessionProvider } from '../services/session';
export default function Layout() {
  return <SessionProvider><Stack screenOptions={{ headerStyle: { backgroundColor: '#17394f' }, headerTintColor: '#fff', headerTitle: 'Alianza Servicios' }} /></SessionProvider>;
}
