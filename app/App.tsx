import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { conformity, sections } from './src/ticket-schema';

export default function App() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const section = sections[sectionIndex];
  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <View style={styles.header}><Text style={styles.brand}>ALIANZA INFORMÁTICA</Text><Text style={styles.subtitle}>Servicio técnico · Instalación · Mantenimiento · Soporte</Text></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.notice}>Prototipo académico local. Usa datos ficticios. Los campos permanecen solo en memoria y se pierden al cerrar o recargar. Sin cuentas, carga de archivos, firma electrónica ni conexión a Firebase.</Text>
        <Text style={styles.title}>Formato de servicio</Text>
        <View style={styles.tabs}>{sections.map((item, index) => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => setSectionIndex(index)} style={[styles.tab, index === sectionIndex && styles.active]}><Text style={index === sectionIndex ? styles.white : styles.tabText}>{index === 0 ? 'Inicio' : item.title.split('.')[0]}</Text></Pressable>)}</View>
        <Text style={styles.heading}>{section.title}</Text>
        {sectionIndex === sections.length - 1 && <Text style={styles.notice}>{conformity} En esta demo los campos de firma son referencias de texto; no constituyen una firma capturada.</Text>}
        {section.fields.map(field => {
          const key = `${section.title}/${field.label}`;
          const value = values[key] || '';
          return <View key={key} style={styles.field}><Text style={styles.label}>{field.label}</Text>{field.options ? <View style={styles.options}>{field.options.map(option => {
            const selected = value.split('|').includes(option);
            return <Pressable key={option} accessibilityRole={field.multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected }} onPress={() => {
              const next = field.multiple ? (selected ? value.split('|').filter(v => v !== option) : [...value.split('|').filter(Boolean), option]).join('|') : option;
              setValues(previous => ({ ...previous, [key]: next }));
            }} style={[styles.choice, selected && styles.selected]}><Text>{selected ? '✓ ' : ''}{option}</Text></Pressable>;
          })}</View> : <TextInput accessibilityLabel={field.label} style={styles.input} value={value} onChangeText={next => setValues(previous => ({ ...previous, [key]: next }))} multiline placeholder="Sin capturar" />}</View>;
        })}
        <View style={styles.options}>
          {sectionIndex > 0 && <Pressable accessibilityRole="button" style={styles.choice} onPress={() => setSectionIndex(sectionIndex - 1)}><Text>Anterior</Text></Pressable>}
          {sectionIndex < sections.length - 1 && <Pressable accessibilityRole="button" style={styles.choice} onPress={() => setSectionIndex(sectionIndex + 1)}><Text>Siguiente</Text></Pressable>}
        </View>
        <Text style={styles.footer}>La numeración conserva el salto del apartado 8 al 10 del documento original. La exportación con el diseño exacto de cuatro páginas está pendiente.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f6fa' },
  header: { backgroundColor: '#193950', padding: 24, paddingTop: 48 },
  brand: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#d7e3ee', marginTop: 6, fontSize: 12 },
  content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 24, paddingBottom: 60 },
  notice: { backgroundColor: '#e5edf6', padding: 16, lineHeight: 21, color: '#213d57', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#193950', marginBottom: 20 },
  heading: { fontWeight: '700', color: '#193950', fontSize: 18, marginVertical: 20 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e1e8f0' },
  active: { backgroundColor: '#193950' }, white: { color: '#fff' }, tabText: { color: '#193950' },
  field: { marginBottom: 18 }, label: { fontWeight: '600', marginBottom: 8, color: '#243c52' },
  input: { backgroundColor: '#fff', borderColor: '#c6d1dc', borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 48, textAlignVertical: 'top' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#becbd8', backgroundColor: '#fff', borderRadius: 8, padding: 12 },
  selected: { backgroundColor: '#d7eadd', borderColor: '#497358' },
  footer: { color: '#596c7c', lineHeight: 20, marginTop: 24 },
});
