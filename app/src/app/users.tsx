import { Redirect, router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { Button, Input, Page, ui } from '../components/ui';
import { roleNames, roles } from '../domain/tickets';
import { useCompanyAccess } from '../services/company-access';
import { useSession } from '../services/session';

export default function Users() {
  const { membership, logout } = useSession();
  const access = useCompanyAccess();
  if (!access.canManageAccess && membership?.role !== 'admin') return <Redirect href={membership ? '/dashboard' : '/'} />;
  return <Page title="Usuarios y permisos">
    {membership && <Button title="Volver al panel" secondary onPress={() => router.replace('/dashboard')} />}
    {!membership && <Button title="Cerrar sesión" secondary onPress={() => void logout()} />}
    {access.canManageAccess && <>
      <View style={ui.card}>
        <Input label="Nueva empresa" value={access.companyName} onChange={access.setCompanyName} disabled={access.busy} />
        <Button secondary title="Crear empresa" disabled={access.busy || !access.companyName.trim()} onPress={access.addCompany} />
      </View>
      <View style={ui.card}>
        <Text style={ui.label}>Empresa para administrar</Text>
        <View style={ui.row}>{access.companies.map(company => <Button key={company.id} title={company.name}
          disabled={access.busy} secondary={company.id !== access.tenantId} onPress={() => access.select(company.id)} />)}</View>
        <Text style={ui.subtitle}>Pide a la persona el UID que aparece después de verificar su correo.</Text>
        <Input label="UID de la cuenta" value={access.uid} onChange={access.setUid} disabled={access.busy} />
        <Input label="Nombre de la persona" value={access.name} onChange={access.setName} disabled={access.busy} />
        <Text style={ui.label}>Rol en esta empresa</Text>
        <View style={ui.row}>{roles.map(role => <Button key={role} title={roleNames[role]}
          disabled={access.busy} secondary={access.role !== role} onPress={() => access.setRole(role)} />)}</View>
        <Button title="Guardar acceso" disabled={access.busy || !access.tenantId || !access.uid.trim() || !access.name.trim()} onPress={access.save} />
      </View>
    </>}
    {access.error && <Text accessibilityRole="alert" style={ui.error}>{access.error}</Text>}
    {access.message && <Text style={ui.notice}>{access.message}</Text>}
    {access.people?.map(person => <View style={ui.card} key={person.uid}>
      <Text style={ui.label}>{person.name || 'Perfil'}</Text><Text>{roleNames[person.role]} · {person.active ? 'Activo' : 'Suspendido'}</Text>
      {access.canManageAccess && <View style={ui.row}>
        <Button secondary title={person.active ? 'Editar acceso' : 'Preparar reactivación'} disabled={access.busy} onPress={() => access.edit(person)} />
        {person.active && <Button secondary title="Suspender" disabled={access.busy} onPress={() => Alert.alert(
          'Suspender acceso', `¿Suspender a ${person.name} en esta empresa?`,
          [{ text: 'Cancelar', style: 'cancel' }, { text: 'Suspender', onPress: () => void access.suspend(person) }],
        )} />}
      </View>}
    </View>)}
    {!access.error && access.tenantId && (access.people ? (!access.people.length && <Text>Sin perfiles asignados.</Text>) : <Text>Cargando perfiles…</Text>)}
  </Page>;
}
