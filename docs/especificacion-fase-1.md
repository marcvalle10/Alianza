# Especificación del proyecto Alianza Servicios

Entrega fase 1 · Desarrollo de aplicaciones móviles
Proyecto para Alianza Informática · 26 de octubre de 2026

## Objetivo

Desarrollar una aplicación para que clientes de Alianza Informática reporten fallas o soliciten trabajos desde sus instalaciones, y para que el personal asigne, atienda y documente cada servicio hasta su cierre. El expediente digital deberá conservar los campos y la numeración del formato de servicio proporcionado.

## Propuesta tecnológica

Expo con React Native y TypeScript será la base móvil y permitirá una versión web. Firebase gestionará cuentas por correo, base de datos y archivos. Node.js se utilizará en funciones de backend para operaciones privilegiadas e integración con IA. Electron se reserva para empaquetar una interfaz de escritorio en una fase posterior. Electron construye aplicaciones de escritorio; no sustituye Expo ni genera por sí mismo una app móvil o una web alojada [1, 2].

## Cinco funciones principales

1. Acceso por correo con perfiles de cliente, técnico y administrador.
2. Creación de solicitudes con los datos del formato original.
3. Gestión de prioridad, asignación y estados Pendiente, En proceso, Concluido y Requiere seguimiento.
4. Expediente con diagnóstico, actividades, cotización, evidencias, resultados, costos y conformidad.
5. Asistencia opcional de IA para sugerir clasificación y resumen técnico, con revisión humana.

## Alcance de fase 1

Se entrega una base Expo y un formulario navegable local con el esquema del ticket, documentación y workflow de integración continua. La primera fase no equivale al sistema operativo para clientes: faltan autenticación real, almacenamiento, reglas por empresa, adjuntos, firmas, IA y exportación fiel del PDF. Los controles y plazos futuros se describen en la auditoría preventiva.

# Formato original y reglas del servicio

## Contrato de fidelidad

El documento de referencia tiene cuatro páginas. Se deben mantener títulos, orden, opciones, texto de conformidad y salto de la sección 8 a la 10; no agregar una sección 9. Nombre, RFC, firmas, fechas y valores del ejemplo son datos variables, no valores predeterminados. Se preservará la denominación ALIANZA INFORMÁTICA del formato.

Página 1: encabezado, folio y fechas; 1 Datos del cliente; 2 Tipo de servicio y prioridad; 3 Equipo, sistema o área atendida; 4 Diagnóstico y solicitud del cliente; 5 Actividades realizadas.
Página 2: 6 PROPUESTA ECONOMICA, cotización adjunta, categorías de evidencia, referencias y ANTES.
Página 3: DESPUES; 7 Resultado, pruebas y seguimiento; 8 Costos del servicio posteriores adicionales a instalación.
Página 4: 10 Conformidad y firmas, cuatro participantes y campos Signature y Email.

## Cotización y evidencia

La cotización del ejemplo es una imagen con su propio diseño. El sistema permitirá adjuntarla sin reconstruirla. Los originales se conservarán conforme a autorización y retención; las imágenes que se suban deberán ser pertinentes y prepararse sin datos innecesarios. El formulario móvil puede dividirse en pasos; la salida documental deberá respetar el diseño original, con una comparación visual de las cuatro páginas antes de aceptarse.

## Flujo de atención previsto

Cliente autenticado crea solicitud y confirma envío > administrador valida prioridad y asigna técnico > técnico registra diagnóstico y trabajo > responsable revisa propuesta o costos cuando existan > técnico registra pruebas > participantes manifiestan conformidad > cierre o seguimiento. El cliente no cambia estados internos, costos ni asignaciones mediante una solicitud manipulada.

## Campos por etapa

Al crear: cliente, contacto, tipo, prioridad solicitada, descripción y ubicación cuando proceda. Al atender: diagnóstico, actividades y evidencias pertinentes. Al cerrar: resultado, pruebas, fecha de terminación y conformidad aplicable. Los campos no pertinentes conservan su lugar y admiten No aplica. La IA no rellena firmas ni inventa pruebas o autorizaciones.

# Arquitectura y seguridad previstas

## Componentes

Clientes y personal > Expo móvil o web > Firebase Authentication.
Sesión autorizada > Firestore para datos estructurados y Storage para archivos.
Operaciones privilegiadas > Cloud Functions con Node.js > Firebase Admin.
Asistencia opcional > backend con filtros y consentimiento > proveedor de IA aprobado.
Electron futuro > interfaz web empaquetada y mismas API autorizadas.

## Modelo de datos

users/{uid}: nombre y referencia empresarial. tenants/{tenantId}/members/{uid}: rol validado por backend. tenants/{tenantId}/tickets/{ticketId}: secciones del formato, estado, creador, asignación y fechas. Subcolecciones attachments, events y consents con permisos propios. Storage bajo tenants/{tenantId}/tickets/{ticketId}/; nunca rutas públicas compartidas. El folio será generado de forma consistente por backend, no por el dispositivo.

## Control de acceso

Cliente: solicitudes propias; acceso a otras solicitudes de su empresa solo por autorización explícita. Técnico: expedientes asignados. Administrador: asignación y supervisión necesarias. Comprobar membresía y campos modificables en reglas y backend. Las credenciales Admin evitan reglas cliente, por lo que cada función debe verificar permisos. No basta esconder botones en la pantalla.

## Integración con IA agentes y MCP

La integración prevista es una API de IA detrás del backend; no se necesita un agente autónomo ni MCP en esta fase. Entrada mínima: extracto técnico revisado sin identificadores. Salida estructurada: categoría sugerida y resumen. No enviar el ticket completo, fotos, firmas o precios. Mostrar propuesta y requerir aceptación humana; registrar solo que se aceptó o rechazó. Tratar el texto del ticket como datos, sin ejecutar instrucciones incrustadas ni habilitar herramientas de modificación.

Proveedor, modelo y región pendientes de evaluación. La función se mantiene desactivada hasta documentar condiciones y consentimiento. El API key solo vive en secretos del backend. Evitar incluir secretos en variables EXPO_PUBLIC, compilaciones o repositorios.

## Distribución

Primero validar Android y web con datos ficticios. iOS requiere pruebas y entorno de compilación compatible. Electron se evaluará después: aislamiento de contexto, sandbox y sin Node integrado en el renderizador. No habilitar acceso privilegiado para páginas remotas.

# Repositorio estructura e integración continua

## Estructura de trabajo

/app: proyecto Expo con TypeScript, formulario y catálogo de campos.
/docs: especificación, auditoría y guía de configuración remota.
/.github/workflows/ci.yml: integración continua.
/.github/pull_request_template.md: plantilla de revisión.
/scripts/check-commits.mjs: validación de Conventional Commits.
/.env.example: variables futuras sin credenciales.
/README.md: instalación, ejecución, alcance y pendientes.

## Ramas y primer commit

main contendrá la versión revisada. develop partirá del primer commit y reunirá avances; las funciones se trabajarán en ramas breves y se integrarán mediante pull request. Primer mensaje propuesto: feat: initialize alianza service project. No publicar el formato cumplimentado ni sus fotografías en GitHub.

## Pipeline implementado

En pushes a main y develop y en pull requests: descargar historial > comprobar todos los commits nuevos con Conventional Commits > instalar desde package-lock con npm ci > ejecutar ESLint > comprobar tipos y sintaxis con TypeScript > exportar web. Para el primer push sin SHA anterior, validar el historial accesible. Los commits de merge se omiten; el mensaje de squash debe conservar la convención.

## Protección remota requerida

En GitHub: exigir pull request y check quality, resolver conversaciones, bloquear force push y eliminación de main. Exigir revisión cuando exista otro colaborador. Verificar compatibilidad del plan con reglas en repositorios privados. La existencia de un workflow o de esta instrucción no significa que la rama esté protegida ni que Actions haya pasado.

## CI y CD

La fase 1 implementa CI. No se configuran despliegues automáticos, cuentas de producción ni publicación en tiendas. CD se incorporará tras disponer de ambientes, secretos, reglas verificadas y criterio de aprobación. El detalle de comprobaciones efectivamente ejecutadas se registra en docs/estado-entrega.md.

# Plan de implementación y criterios de entrega

## Secuencia recomendada

Paso 1: validar campos y flujo con el responsable de Alianza; completar datos legales y aprobar retención.
Paso 2: terminar repositorio remoto, reglas de main y comprobar Actions.
Paso 3: integrar Firebase en un ambiente de prueba con cuentas ficticias y pruebas de aislamiento.
Paso 4: implementar adjuntos, firma, cierre y exportación fiel de las cuatro páginas.
Paso 5: incorporar asistencia de IA opcional, probar privacidad y preparar piloto de clientes.
Paso 6: evaluar distribución de escritorio con Electron.

## Criterios de aceptación de fase 1

Documento de especificación disponible; /app arranca con setup documentado; linter, tipos y exportación pasan; todos los commits cumplen convención; primer commit en main; develop creada. Para cerrar la entrega remota se requieren URL de GitHub, ejecución verde verificable y evidencia de protección de main. Un éxito local no sustituye esa evidencia.

## Criterios del producto posterior

Crear una solicitud desde móvil; consultar solo tickets autorizados; actualizar estado como técnico; cargar evidencias seleccionadas; impedir modificaciones indebidas de costos y roles; completar conformidad; exportar documento comparado visualmente con la referencia; ejercer borrado conforme a retención; rechazar IA sin afectar el servicio. Probar también red caída, carga fallida y cierre de sesión en dispositivo compartido.

## Decisiones pendientes de la empresa

Confirmar responsable jurídico y contacto ARCO; política de visibilidad de tickets por cliente; quién aprueba propuestas; qué firmas exige cada servicio; plazos contractuales y fiscales; región y presupuesto de Firebase; titularidad del repositorio; proveedor de IA. Estas decisiones no impiden preparar la base local, pero sí condicionan un piloto real.

## Fuentes técnicas

[1] Expo y Firebase: https://docs.expo.dev/guides/using-firebase/
[2] Electron: https://www.electronjs.org/docs/latest
[3] Firebase SDK web: https://firebase.google.com/docs/web/setup
[4] Privacidad Firebase: https://firebase.google.com/support/privacy
Referencia interna: AI_SERVICIO_0001.pdf, cuatro páginas proporcionadas para análisis de requisitos. No se redistribuye el ejemplar cumplimentado.
