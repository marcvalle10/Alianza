import { Redirect, Stack } from 'expo-router';
import { Text } from 'react-native';
import { useSession } from '../../services/session';
export default function TicketsLayout() {
  const { user, membership, loading } = useSession();
  if (loading) return <Text>Consultando acceso…</Text>;
  if (!user?.emailVerified || !membership) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
