import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f2f5f9' }, content: { width: '100%', maxWidth: 920, alignSelf: 'center', padding: 24, gap: 16, paddingBottom: 64 },
  title: { color: '#17394f', fontSize: 28, fontWeight: '700' }, subtitle: { color: '#526577', lineHeight: 22 },
  card: { padding: 20, backgroundColor: '#fff', borderColor: '#dce5ed', borderWidth: 1, borderRadius: 14, gap: 12 },
  label: { color: '#243d52', fontWeight: '600', marginBottom: 6 }, input: { borderColor: '#b9c9d7', borderWidth: 1, borderRadius: 8, backgroundColor: '#fff', padding: 12, minHeight: 48, color: '#17394f' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, button: { backgroundColor: '#17394f', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondary: { backgroundColor: '#e4ecf3' }, white: { color: '#fff', fontWeight: '600' }, dark: { color: '#17394f', fontWeight: '600' },
  error: { backgroundColor: '#ffeded', color: '#8b2424', padding: 12, borderRadius: 8, lineHeight: 21 },
  notice: { backgroundColor: '#e3edf6', color: '#23415d', padding: 14, borderRadius: 8, lineHeight: 21 }, disabled: { opacity: 0.5 },
});
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return <ScrollView style={ui.page} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled"><Text style={ui.subtitle}>ALIANZA INFORMÁTICA</Text><Text style={ui.title}>{title}</Text>{children}</ScrollView>;
}
export function Button({ title, onPress, disabled, secondary }: { title: string; onPress(): void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} style={[ui.button, secondary && ui.secondary, disabled && ui.disabled]}><Text style={secondary ? ui.dark : ui.white}>{title}</Text></Pressable>;
}
export function Input({ label, value, onChange, secure, multiline, disabled, email }: { label: string; value: string; onChange(value: string): void; secure?: boolean; multiline?: boolean; disabled?: boolean; email?: boolean }) {
  return <View><Text style={ui.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} style={ui.input} editable={!disabled} maxLength={4000} secureTextEntry={secure} multiline={multiline} autoCapitalize={email || secure ? 'none' : 'sentences'} autoCorrect={!email && !secure} keyboardType={email ? 'email-address' : 'default'} /></View>;
}
