from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
DOCS = ROOT / 'docs'
DOCS.mkdir(exist_ok=True)

# Cada registro relaciona todos sus campos con captura, finalidad, flujo, base y conservación.
inventory = [
 ('D01 Cuenta', 'Correo de acceso, contraseña y UID.', 'Registro e inicio de sesión; obligatorios para una cuenta futura.', 'Autenticar y recuperar acceso. La contraseña se entrega únicamente a Authentication; nunca se copia a Firestore ni a registros.', 'F1; B1; R1.'),
 ('D02 Perfil y acceso', 'Nombre, empresa, tenantId, rol y técnico asignado.', 'Perfil y administración; obligatorios. Rol y tenantId los establece el administrador, no el cliente.', 'Separar empresas y limitar acceso. Necesarios; no solicitar identificación oficial.', 'F2; B1; R1 y R3 para la asignación histórica.'),
 ('D03 Control del servicio', 'Folio, fecha de solicitud, fecha de terminación y número de orden o referencia.', 'Encabezado y apartado 1; folio y fecha inicial automáticos; cierre obligatorio al concluir; orden opcional.', 'Trazabilidad del trabajo. No incluir nombres o correos en el folio.', 'F2; B1; R3.'),
 ('D04 Identificación del cliente', 'Empresa o cliente y RFC.', 'Apartado 1; nombre obligatorio; RFC solo si la operación fiscal o contractual lo requiere.', 'Identificar al solicitante y su referencia fiscal. Conservar el campo, pero no exigir RFC para levantar una incidencia.', 'F2; B1 y B2 cuando corresponda; R3, o R4 si forma parte de documentación fiscal.'),
 ('D05 Contacto del servicio', 'Contacto responsable, teléfono y correo electrónico.', 'Apartado 1; responsable y un medio de contacto obligatorios; teléfono opcional si basta el correo.', 'Coordinar visita y aclaraciones. Reutilizar datos confirmados de la cuenta; no leer agenda del dispositivo.', 'F2; B1; R3.'),
 ('D06 Localización manual', 'Domicilio del servicio, área o departamento, ubicación específica y ubicación del equipo.', 'Apartados 1 y 3; obligatorios para visita física; opcionales o No aplica para soporte remoto.', 'Encontrar el lugar de trabajo. Captura manual, sin GPS ni seguimiento continuo.', 'F2; B1; R3.'),
 ('D07 Clasificación', 'Tipo de atención, prioridad y estado del servicio.', 'Apartado 2; obligatorios. Cliente solicita prioridad; personal confirma la gestión.', 'Organizar la atención. Conservar Pendiente, En proceso, Concluido y Requiere seguimiento.', 'F2; B1; R3.'),
 ('D08 Activos', 'Equipo o sistema, marca, modelo, número de serie o inventario y cantidad.', 'Apartado 3; equipo o sistema requerido; demás campos condicionales según el servicio.', 'Diagnóstico e identificación del activo. Evitar inventariar equipos ajenos al trabajo.', 'F2; B1; R3.'),
 ('D09 Solicitud y diagnóstico', 'Descripción de falla, necesidad o alcance y diagnóstico técnico o causa probable.', 'Apartado 4; solicitud obligatoria; diagnóstico al atender, no al crear.', 'Entender y resolver la incidencia. No registrar contraseñas, accesos físicos, salud ni documentos personales.', 'F2; B1; R3. Solo una copia revisada y sin identificadores podría usar F4 con B3.'),
 ('D10 Trabajo realizado', 'Actividades marcadas, texto de Otro y detalle del trabajo realizado.', 'Apartado 5; obligatorio al documentar la atención; Otro solo al seleccionarlo.', 'Dejar evidencia técnica. Limitar nombres de terceros y detalles de seguridad innecesarios.', 'F2; B1; R3.'),
 ('D11 Propuesta económica', 'Archivo de cotización: fabricante, modelo, cantidad, descripción, precio unitario, subtotal, tiempo de entrega, IVA, total, moneda y condiciones de pago, validez y entrega cuando aparezcan en el documento.', 'Apartado 6; condicional si existe propuesta.', 'Respaldar una autorización económica. La propuesta del ejemplo es una imagen adjunta; no se reconstruye ni altera su tabla.', 'F3 para archivo y F2 para referencia; B2; R4.'),
 ('D12 Evidencias', 'Fotos Antes y Después, etiquetas o serie, capturas o reporte, archivos, nombre o referencia, enlace y observaciones.', 'Apartado 6 y continuación en página 3; opcionales salvo evidencia necesaria del trabajo.', 'Documentar el servicio. Elegir archivos puntuales, quitar EXIF y evitar caras, placas y credenciales. No subir toda la galería.', 'F3 y F2 para metadatos; B1 más selección y aviso de carga; R5.'),
 ('D13 Resultado', 'Resultado marcado, pruebas finales, motivo de no realización, observaciones y recomendaciones.', 'Apartado 7; resultado y pruebas al cierre; motivo obligatorio si no se realizaron.', 'Informar el estado real del servicio y limitaciones. No inferir resultados mediante IA.', 'F2; B1; R3.'),
 ('D14 Seguimiento', 'Acción requerida, fecha propuesta de próxima visita y responsable del seguimiento.', 'Apartado 7; condicional si existe seguimiento.', 'Coordinar pendientes. Sin importar calendarios ni contactos personales.', 'F2; B1; R3.'),
 ('D15 Costos adicionales', 'Concepto, cantidad, precio unitario, importe, subtotal, IVA, total en MXN y condiciones o autorización de costos; incluye mano de obra, materiales o refacciones y traslado u otros.', 'Apartado 8; solo si aplican. Mantener No aplican.', 'Registrar costos, no procesar pagos. No recolectar tarjetas, CLABE ni credenciales bancarias.', 'F2; B2; R4.'),
 ('D16 Conformidad', 'Nombre, cargo, empresa, firma y correo de prestador, responsable y dos corresponsables.', 'Apartado 10; según participación efectiva. No obligar a inventar cuatro firmantes si no existen.', 'Acreditar recepción conforme al texto original. Firma gráfica, sin análisis biométrico de presión o velocidad. No equivale a consentimiento de IA.', 'F2 para identidad y F3 para firma; B1; R3 o R4 si integra documento contractual.'),
 ('D17 Seguridad y preferencias', 'UID, evento de acceso o cambio, fecha, versión del aviso, selección de consentimiento y revocación; IP y datos técnicos tratados por servicios.', 'Sistema y preferencias; eventos mínimos necesarios, consentimiento de IA opcional.', 'Auditar acceso y decisiones. No guardar contenido completo ni tokens en logs; sin publicidad ni analítica de comportamiento.', 'F5; B1 y B3 para la evidencia de elección; R6 y R7.'),
 ('D18 Sesión y borradores', 'Token de sesión y campos en edición.', 'Dispositivo; necesarios mientras se usa la app. En el prototipo solo existen campos en memoria, no tokens.', 'Mantener trabajo y sesión. En producción usar almacenamiento seguro y limpiar al salir; caché persistente desactivada inicialmente.', 'F0, con token emitido por F1; B1; R0.'),
 ('D19 Asistencia de IA', 'Extracto técnico revisado, categoría sugerida, resumen y registro mínimo de aceptación.', 'Botón de asistencia futuro; completamente opcional.', 'Sugerir organización del ticket. No enviar RFC, domicilio, contactos, firmas, fotos, precios, folio o tenantId al modelo. No modificar el formato original.', 'F4; B3; R8. Proveedor, país y retención contractual pendientes; bloqueado hasta definirlos.'),
]

audit = [
('Auditoría preventiva de privacidad', [
('p', 'Alianza Servicios | Aplicación de tickets de Alianza Informática\nActividad 1 · 26 de octubre de 2026 · Versión 1.0'),
('h', 'Objeto y conclusión'),
('p', 'El proyecto permitirá a clientes solicitar trabajos y al personal gestionar servicios pendientes, en proceso y concluidos. Esta auditoría identifica los datos del formato AI_SERVICIO_0001.pdf y los flujos previstos de la solución Expo, Firebase y backend Node.js. El mercado inicial asumido es México.'),
('p', 'El resultado es una auditoría de diseño, no una certificación de una app desplegada. El prototipo de fase 1 captura campos en memoria local. No integra Firebase ni una API de IA, no tiene usuarios reales y no cuenta con publicaciones en tiendas. No se ha realizado una inspección de tráfico de una versión móvil instalada.'),
('h', 'Evidencia examinada'),
('p', 'Se revisaron visualmente las cuatro páginas del formato, incluida la cotización incorporada como imagen, fotos y bloques de firma. El código inicial conserva la secuencia 1 a 8 y 10. El PDF contiene datos reales; su contenido cumplimentado, fotografías y datos de contacto no se copian al repositorio ni a ejemplos.'),
('h', 'Regla de lectura del inventario'),
('p', 'D identifica cada grupo de datos relacionados. Cada campo se enumera expresamente. F identifica el destino, B la base o autorización prevista y R la retención propuesta. La obligatoriedad corresponde al diseño funcional futuro: el prototipo todavía no valida los requisitos por etapa. Todos los controles de nube y consentimiento descritos están pendientes de implementación.'),
('h', 'Límites de la primera versión'),
('p', 'No se prevé recopilar GPS, agenda, audio, publicidad, identificadores publicitarios, biometría, datos de salud o tarjetas. Sí se contemplan domicilios escritos, fotos, costos y firmas. Preservar campos del formato no exige capturarlos cuando no son pertinentes; se admite No aplica según la operación.'),
]),
('Inventario de cuentas y solicitud', []),
('Inventario del trabajo y evidencias', []),
('Inventario de cierre y datos técnicos', []),
('Flujos y servicios receptores', [
('h', 'F0 y F1 Dispositivo y autenticación'),
('p', 'F0: campos en memoria del dispositivo; en la demo no existe envío programado por la app. F1 futuro: dispositivo > Firebase Authentication, operado por Google en Estados Unidos, para correo, contraseña, UID y datos técnicos de acceso. La selección de otra región de base de datos no cambia esta ubicación de Authentication [2].'),
('h', 'F2 y F3 Expedientes y archivos'),
('p', 'F2 futuro: app > Cloud Firestore, y operaciones privilegiadas > Cloud Functions con Node.js > Firestore. F3 futuro: app > Cloud Storage para archivos y firmas; Firestore mantiene referencias. Propuesta de residencia: us-central1, Estados Unidos, para base, bucket y funciones compatibles. La región no ha sido configurada y debe verificarse por recurso; infraestructura y subencargados pueden tener tratamientos adicionales [2, 3].'),
('p', 'El backend pertenece lógicamente al proyecto de la empresa, pero está alojado por Google. Usuarios de una empresa solo verán expedientes autorizados de esa empresa; técnicos, los asignados; administradores, lo necesario para su función. El SDK cliente no debe decidir roles ni confiar en un tenantId enviado sin validación.'),
('h', 'F4 Asistencia externa de IA'),
('p', 'Futuro: vista previa revisada por el usuario > backend Node.js que verifica identidad, permiso y consentimiento > API de IA aprobada > sugerencia al usuario. No existe proveedor contratado ni país confirmado. No se habilitará este flujo hasta definir contrato, subencargados, región, retención y exclusión de entrenamiento que correspondan. El modelo no recibe acceso directo a Firestore o Storage.'),
('h', 'F5 Seguridad y consentimiento'),
('p', 'Eventos mínimos > Firestore y registros de backend. Aplicar la misma región propuesta cuando sea configurable; verificar ubicación y retención de Cloud Logging y de datos de servicio de Google. No prometer que los registros del proveedor se borran con el ticket.'),
('h', 'Inventario de SDK y API'),
('p', 'Activos: Expo, React y React Native para interfaz; ningún SDK de IA ni Firebase instalado. Previstos: Firebase JS SDK para Auth, Firestore y Storage; Firebase Admin solo en backend con privilegios mínimos. API de IA sin seleccionar. Analytics, Crashlytics, FCM, reconocimiento facial, mapas y MCP quedan fuera de la fase 1. Expo Go y herramientas de desarrollo no son una build de producción; revisar sus prácticas por separado antes de probar con datos reales.'),
]),
('Base jurídica y autorizaciones', [
('h', 'Marco territorial'),
('p', 'Para la operación privada en México se toma como referencia la LFPDPPP vigente. Antes del piloto se debe confirmar la razón social responsable, domicilio y canal ARCO, así como las obligaciones frente a las empresas clientes. GDPR, CCPA y LGPD no se consideran automáticamente aplicables por usar Firebase; reevaluar alcance territorial y umbrales si se atienden personas o mercados de la UE, California o Brasil.'),
('h', 'B1 Servicio y cuenta'),
('p', 'Para D01 a D10, D12 a D14, D16 a D18: informar finalidades antes de captar datos y documentar consentimiento o la excepción aplicable a una relación jurídica, cuando realmente se cumpla. La relación de la empresa cliente no autoriza por sí sola cualquier dato de sus empleados. Registrar fuente y autorización de contactos y firmantes aportados por terceros [1].'),
('h', 'B2 Información económica'),
('p', 'Para RFC y D11/D15, valorar si hay datos de personas físicas de carácter financiero o patrimonial; en ese supuesto se requiere consentimiento expreso salvo excepción legal documentada. La información de una persona moral no siempre es dato personal, pero sus contactos y firmas sí pueden identificar personas [1].'),
('h', 'B3 Asistencia opcional'),
('p', 'Consentimiento separado, no premarcado y revocable antes del envío a IA; explicar finalidad, destinatario, país, datos exactos y retención. Permitir trabajar sin IA. La firma de recepción del apartado 10 y el permiso de cámara no sustituyen este consentimiento. Guardar versión, fecha, usuario y alcance aceptado.'),
('h', 'Salidas sin autorización clara'),
('p', 'No se ha confirmado una salida no autorizada del prototipo. Riesgos futuros prioritarios: RIESGO A, inicializar servicios antes de informar al usuario; RIESGO B, enviar tickets completos a IA; RIESGO C, subir adjuntos o EXIF automáticamente; RIESGO D, invitar contactos o publicar archivos con enlaces abiertos; RIESGO E, compartir tickets entre empresas. Todos deben quedar bloqueados antes del piloto.'),
('h', 'Verificación requerida'),
('p', 'Capturar tráfico con datos ficticios: abrir app sin aceptar; crear cuenta; adjuntar foto; rechazar IA; aceptar un único envío; revocar; cerrar sesión. Comparar destinos y campos con F0 a F5. Guardar evidencias sin secretos. Revisar contrato de encargado con Google y condiciones de cualquier proveedor adicional [3].'),
]),
('Minimización retención y borrado', [
('p', 'Los siguientes plazos son decisiones propuestas para aprobación del responsable, no plazos legales universales ni configuraciones ya activas. La tabla D remite a estos códigos para cubrir cada dato.'),
('h', 'R0 y R1 Sesión y cuenta'),
('p', 'R0: campos de la demo hasta cerrar o recargar; en producción, token hasta expiración o revocación, limpiar sesión al salir. Borradores futuros: máximo 7 días o borrado manual. R1: perfil mientras la cuenta esté activa; eliminación operativa en hasta 30 días tras solicitud validada, salvo conservación justificada de referencias históricas.'),
('h', 'R3 y R4 Expediente y costos'),
('p', 'R3: expediente técnico hasta 24 meses desde el cierre; revisar necesidad al vencer garantía o contrato. R4: documentación contractual o fiscal, plazo determinado por obligación y prescripción aplicables antes del piloto; propuesta inicial de revisión a 5 años, sujeta a validación contable y jurídica. La suspensión por litigio debe tener motivo, responsable, fecha y revisión; no habilita conservación indefinida.'),
('h', 'R5 a R8 Adjuntos y trazabilidad'),
('p', 'R5: evidencias hasta 12 meses tras cierre, salvo las mínimas que deban integrarse al expediente contractual. R6: logs operativos 90 días. R7: evidencia de aviso y consentimiento mientras dure el tratamiento más 24 meses, sujeto a prescripción aplicable. R8: texto enviado a IA sin persistencia en backend; sugerencia aceptada bajo R3; historial de prompts desactivado. Retención del proveedor de IA pendiente: no activarlo hasta conocerla.'),
('h', 'Proceso de borrado propuesto'),
('p', 'Solicitud desde perfil o canal ARCO > comprobar identidad proporcionalmente > localizar UID, tickets, adjuntos y copias > determinar bloqueo o excepción > revocar sesiones > borrar Auth, Firestore, subcolecciones, archivos y referencias > confirmar resultado. Borrar la cuenta de Auth no elimina por sí solo los tickets ni Storage. Un trabajador que deja una empresa no puede borrar unilateralmente todo el expediente empresarial.'),
('p', 'Configurar purga de respaldos en un máximo operativo propuesto de 30 días, sujeto a capacidades y políticas de cada servicio. Mantener una lista mínima de borrados para evitar reintroducción al restaurar. Gestionar descargas locales y archivos exportados; la empresa debe informar los límites de eliminación de copias entregadas legítimamente a terceros.'),
('h', 'Datos a eliminar o evitar'),
('p', 'Excluir EXIF, duplicados, imágenes no pertinentes, datos de terceros en texto libre, tokens en logs y copias de contraseñas. Mantener opcionales RFC, teléfono secundario y firmas no participantes. Restringir campos económicos y firmas a quienes los necesiten. Todas las tareas de purga y solicitudes ARCO siguen sin implementar.'),
]),
('Declaraciones públicas y plan de corrección', [
('h', 'Comparación con el comportamiento observado'),
('p', 'Política publicada: no existe evidencia de una política de esta app. Apple App Privacy y Google Data Safety: no existen fichas publicadas aportadas. Comportamiento del prototipo: captura local sin integración de nube. Por tanto, no es posible afirmar coincidencia o discrepancia frente a declaraciones inexistentes. La ausencia de aviso y fichas es una brecha de preparación para el lanzamiento, no prueba de una declaración falsa.'),
('h', 'Declaraciones que corresponderán a producción'),
('p', 'Preparar categorías de contacto, identificadores de cuenta, contenido del usuario, fotos, dirección escrita y datos económicos cuando identifiquen personas; incluir datos técnicos realmente tratados. Muchos estarán vinculados a la cuenta. Finalidades: funcionalidad, gestión de cuentas y seguridad. No marcar No se recopilan datos si se usa la arquitectura de nube [4, 5].'),
('p', 'Evaluar por separado la definición de recopilación de Apple y Google, y las excepciones de compartición por proveedor de servicios en Google Play. Una dirección escrita no equivale a GPS: clasificar conforme a las preguntas exactas de cada tienda. El diseño no contempla publicidad, venta de datos ni seguimiento entre apps; comprobar SDK y tráfico antes de declararlo [4, 5].'),
('h', 'Acciones antes de usuarios reales'),
('p', 'Prioridad crítica: responsable y canal ARCO; aviso accesible; aprobación de retención; Firebase con reglas por empresa y rol; pruebas de aislamiento; servicios externos configurados y documentados. Prioridad alta: carga selectiva y sin EXIF, borrado integral, bloqueo de IA no autorizada y revisión de texto libre. Antes de tiendas: conciliar aviso, build final y etiquetas; registrar evidencia y fecha de revisión.'),
('h', 'Responsables y aceptación'),
('p', 'La dirección de Alianza aprueba finalidad, retención y proveedores; desarrollo implementa y prueba controles; administración atiende derechos con apoyo jurídico cuando corresponda. Aceptación: cliente A no accede al ticket ni archivo de B; técnico no cambia roles; rechazar IA produce cero llamadas al proveedor; eliminar cuenta ejecuta la política de retención; exportación no expone datos a enlaces públicos.'),
('h', 'Hallazgo adicional de dependencias'),
('p', 'La revisión final de npm audit reportó 34 dependencias afectadas, incluida una alerta crítica en tar, después de actualizar tar y shell-quote. Requiere remediación y análisis de alcance antes del piloto; las validaciones de lint, tipos y compilación no certifican seguridad.'),
('h', 'Fuentes consultadas el 26 de octubre de 2026'),
('p', '[1] LFPDPPP, arts. 7, 8, 9 y 10: https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo125102.html\n[2] Firebase Privacy and Security: https://firebase.google.com/support/privacy\n[3] Firebase Data Processing and Security Terms: https://firebase.google.com/terms/data-processing-terms\n[4] Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/\n[5] Google Play Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469'),
]),
]
for page, rows in zip([1,2,3], [inventory[:7], inventory[7:13], inventory[13:]]):
    for name, data, capture, purpose, mapping in rows:
        audit[page][1].extend([('h', name), ('p', f'{data}\nCaptura: {capture}\nUso y minimización: {purpose}\nDestino, base y retención: {mapping}')])

spec = [
('Especificación del proyecto Alianza Servicios', [
('p', 'Entrega fase 1 · Desarrollo de aplicaciones móviles\nProyecto para Alianza Informática · 26 de octubre de 2026'),
('h', 'Objetivo'),
('p', 'Desarrollar una aplicación para que clientes de Alianza Informática reporten fallas o soliciten trabajos desde sus instalaciones, y para que el personal asigne, atienda y documente cada servicio hasta su cierre. El expediente digital deberá conservar los campos y la numeración del formato de servicio proporcionado.'),
('h', 'Propuesta tecnológica'),
('p', 'Expo con React Native y TypeScript será la base móvil y permitirá una versión web. Firebase gestionará cuentas por correo, base de datos y archivos. Node.js se utilizará en funciones de backend para operaciones privilegiadas e integración con IA. Electron se reserva para empaquetar una interfaz de escritorio en una fase posterior. Electron construye aplicaciones de escritorio; no sustituye Expo ni genera por sí mismo una app móvil o una web alojada [1, 2].'),
('h', 'Cinco funciones principales'),
('p', '1. Acceso por correo con perfiles de cliente, técnico y administrador.\n2. Creación de solicitudes con los datos del formato original.\n3. Gestión de prioridad, asignación y estados Pendiente, En proceso, Concluido y Requiere seguimiento.\n4. Expediente con diagnóstico, actividades, cotización, evidencias, resultados, costos y conformidad.\n5. Asistencia opcional de IA para sugerir clasificación y resumen técnico, con revisión humana.'),
('h', 'Alcance de fase 1'),
('p', 'Se entrega una base Expo y un formulario navegable local con el esquema del ticket, documentación y workflow de integración continua. La primera fase no equivale al sistema operativo para clientes: faltan autenticación real, almacenamiento, reglas por empresa, adjuntos, firmas, IA y exportación fiel del PDF. Los controles y plazos futuros se describen en la auditoría preventiva.'),
]),
('Formato original y reglas del servicio', [
('h', 'Contrato de fidelidad'),
('p', 'El documento de referencia tiene cuatro páginas. Se deben mantener títulos, orden, opciones, texto de conformidad y salto de la sección 8 a la 10; no agregar una sección 9. Nombre, RFC, firmas, fechas y valores del ejemplo son datos variables, no valores predeterminados. Se preservará la denominación ALIANZA INFORMÁTICA del formato.'),
('p', 'Página 1: encabezado, folio y fechas; 1 Datos del cliente; 2 Tipo de servicio y prioridad; 3 Equipo, sistema o área atendida; 4 Diagnóstico y solicitud del cliente; 5 Actividades realizadas.\nPágina 2: 6 PROPUESTA ECONOMICA, cotización adjunta, categorías de evidencia, referencias y ANTES.\nPágina 3: DESPUES; 7 Resultado, pruebas y seguimiento; 8 Costos del servicio posteriores adicionales a instalación.\nPágina 4: 10 Conformidad y firmas, cuatro participantes y campos Signature y Email.'),
('h', 'Cotización y evidencia'),
('p', 'La cotización del ejemplo es una imagen con su propio diseño. El sistema permitirá adjuntarla sin reconstruirla. Los originales se conservarán conforme a autorización y retención; las imágenes que se suban deberán ser pertinentes y prepararse sin datos innecesarios. El formulario móvil puede dividirse en pasos; la salida documental deberá respetar el diseño original, con una comparación visual de las cuatro páginas antes de aceptarse.'),
('h', 'Flujo de atención previsto'),
('p', 'Cliente autenticado crea solicitud y confirma envío > administrador valida prioridad y asigna técnico > técnico registra diagnóstico y trabajo > responsable revisa propuesta o costos cuando existan > técnico registra pruebas > participantes manifiestan conformidad > cierre o seguimiento. El cliente no cambia estados internos, costos ni asignaciones mediante una solicitud manipulada.'),
('h', 'Campos por etapa'),
('p', 'Al crear: cliente, contacto, tipo, prioridad solicitada, descripción y ubicación cuando proceda. Al atender: diagnóstico, actividades y evidencias pertinentes. Al cerrar: resultado, pruebas, fecha de terminación y conformidad aplicable. Los campos no pertinentes conservan su lugar y admiten No aplica. La IA no rellena firmas ni inventa pruebas o autorizaciones.'),
]),
('Arquitectura y seguridad previstas', [
('h', 'Componentes'),
('p', 'Clientes y personal > Expo móvil o web > Firebase Authentication.\nSesión autorizada > Firestore para datos estructurados y Storage para archivos.\nOperaciones privilegiadas > Cloud Functions con Node.js > Firebase Admin.\nAsistencia opcional > backend con filtros y consentimiento > proveedor de IA aprobado.\nElectron futuro > interfaz web empaquetada y mismas API autorizadas.'),
('h', 'Modelo de datos'),
('p', 'users/{uid}: nombre y referencia empresarial. tenants/{tenantId}/members/{uid}: rol validado por backend. tenants/{tenantId}/tickets/{ticketId}: secciones del formato, estado, creador, asignación y fechas. Subcolecciones attachments, events y consents con permisos propios. Storage bajo tenants/{tenantId}/tickets/{ticketId}/; nunca rutas públicas compartidas. El folio será generado de forma consistente por backend, no por el dispositivo.'),
('h', 'Control de acceso'),
('p', 'Cliente: solicitudes propias; acceso a otras solicitudes de su empresa solo por autorización explícita. Técnico: expedientes asignados. Administrador: asignación y supervisión necesarias. Comprobar membresía y campos modificables en reglas y backend. Las credenciales Admin evitan reglas cliente, por lo que cada función debe verificar permisos. No basta esconder botones en la pantalla.'),
('h', 'Integración con IA agentes y MCP'),
('p', 'La integración prevista es una API de IA detrás del backend; no se necesita un agente autónomo ni MCP en esta fase. Entrada mínima: extracto técnico revisado sin identificadores. Salida estructurada: categoría sugerida y resumen. No enviar el ticket completo, fotos, firmas o precios. Mostrar propuesta y requerir aceptación humana; registrar solo que se aceptó o rechazó. Tratar el texto del ticket como datos, sin ejecutar instrucciones incrustadas ni habilitar herramientas de modificación.'),
('p', 'Proveedor, modelo y región pendientes de evaluación. La función se mantiene desactivada hasta documentar condiciones y consentimiento. El API key solo vive en secretos del backend. Evitar incluir secretos en variables EXPO_PUBLIC, compilaciones o repositorios.'),
('h', 'Distribución'),
('p', 'Primero validar Android y web con datos ficticios. iOS requiere pruebas y entorno de compilación compatible. Electron se evaluará después: aislamiento de contexto, sandbox y sin Node integrado en el renderizador. No habilitar acceso privilegiado para páginas remotas.'),
]),
('Repositorio estructura e integración continua', [
('h', 'Estructura de trabajo'),
('p', '/app: proyecto Expo con TypeScript, formulario y catálogo de campos.\n/docs: especificación, auditoría y guía de configuración remota.\n/.github/workflows/ci.yml: integración continua.\n/.github/pull_request_template.md: plantilla de revisión.\n/scripts/check-commits.mjs: validación de Conventional Commits.\n/.env.example: variables futuras sin credenciales.\n/README.md: instalación, ejecución, alcance y pendientes.'),
('h', 'Ramas y primer commit'),
('p', 'main contendrá la versión revisada. develop partirá del primer commit y reunirá avances; las funciones se trabajarán en ramas breves y se integrarán mediante pull request. Primer mensaje propuesto: feat: initialize alianza service project. No publicar el formato cumplimentado ni sus fotografías en GitHub.'),
('h', 'Pipeline implementado'),
('p', 'En pushes a main y develop y en pull requests: descargar historial > comprobar todos los commits nuevos con Conventional Commits > instalar desde package-lock con npm ci > ejecutar ESLint > comprobar tipos y sintaxis con TypeScript > exportar web. Para el primer push sin SHA anterior, validar el historial accesible. Los commits de merge se omiten; el mensaje de squash debe conservar la convención.'),
('h', 'Protección remota requerida'),
('p', 'En GitHub: exigir pull request y check quality, resolver conversaciones, bloquear force push y eliminación de main. Exigir revisión cuando exista otro colaborador. Verificar compatibilidad del plan con reglas en repositorios privados. La existencia de un workflow o de esta instrucción no significa que la rama esté protegida ni que Actions haya pasado.'),
('h', 'CI y CD'),
('p', 'La fase 1 implementa CI. No se configuran despliegues automáticos, cuentas de producción ni publicación en tiendas. CD se incorporará tras disponer de ambientes, secretos, reglas verificadas y criterio de aprobación. El detalle de comprobaciones efectivamente ejecutadas se registra en docs/estado-entrega.md.'),
]),
('Plan de implementación y criterios de entrega', [
('h', 'Secuencia recomendada'),
('p', 'Paso 1: validar campos y flujo con el responsable de Alianza; completar datos legales y aprobar retención.\nPaso 2: terminar repositorio remoto, reglas de main y comprobar Actions.\nPaso 3: integrar Firebase en un ambiente de prueba con cuentas ficticias y pruebas de aislamiento.\nPaso 4: implementar adjuntos, firma, cierre y exportación fiel de las cuatro páginas.\nPaso 5: incorporar asistencia de IA opcional, probar privacidad y preparar piloto de clientes.\nPaso 6: evaluar distribución de escritorio con Electron.'),
('h', 'Criterios de aceptación de fase 1'),
('p', 'Documento de especificación disponible; /app arranca con setup documentado; linter, tipos y exportación pasan; todos los commits cumplen convención; primer commit en main; develop creada. Para cerrar la entrega remota se requieren URL de GitHub, ejecución verde verificable y evidencia de protección de main. Un éxito local no sustituye esa evidencia.'),
('h', 'Criterios del producto posterior'),
('p', 'Crear una solicitud desde móvil; consultar solo tickets autorizados; actualizar estado como técnico; cargar evidencias seleccionadas; impedir modificaciones indebidas de costos y roles; completar conformidad; exportar documento comparado visualmente con la referencia; ejercer borrado conforme a retención; rechazar IA sin afectar el servicio. Probar también red caída, carga fallida y cierre de sesión en dispositivo compartido.'),
('h', 'Decisiones pendientes de la empresa'),
('p', 'Confirmar responsable jurídico y contacto ARCO; política de visibilidad de tickets por cliente; quién aprueba propuestas; qué firmas exige cada servicio; plazos contractuales y fiscales; región y presupuesto de Firebase; titularidad del repositorio; proveedor de IA. Estas decisiones no impiden preparar la base local, pero sí condicionan un piloto real.'),
('h', 'Evidencia de fase 1 completada'),
('p', 'Repositorio: https://github.com/marcvalle10/Alianza\nPrimer commit: 1675496. Ramas main y develop publicadas; main predeterminada y protegida. CI de main correcto: https://github.com/marcvalle10/Alianza/actions/runs/40455409429\nEl estado detallado y las alertas de seguridad se encuentran en docs/estado-entrega.md.'),
('h', 'Fuentes técnicas'),
('p', '[1] Expo y Firebase: https://docs.expo.dev/guides/using-firebase/\n[2] Electron: https://www.electronjs.org/docs/latest\n[3] Firebase SDK web: https://firebase.google.com/docs/web/setup\n[4] Privacidad Firebase: https://firebase.google.com/support/privacy\nReferencia interna: AI_SERVICIO_0001.pdf, cuatro páginas proporcionadas para análisis de requisitos. No se redistribuye el ejemplar cumplimentado.'),
]),
]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='DocTitle', fontName='Helvetica-Bold', fontSize=22, leading=27, textColor=HexColor('#152f43'), spaceAfter=20))
styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=HexColor('#1b4562'), spaceBefore=10, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name='Copy', fontName='Helvetica', fontSize=9.5, leading=13.2, spaceAfter=8, alignment=TA_LEFT))

def footer(canvas, doc):
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor('#61717e'))
    canvas.drawString(46, 27, 'ALIANZA SERVICIOS  |  Entrega académica  |  26 octubre 2026')
    canvas.drawRightString(566, 27, str(doc.page))

def build(filename, pages):
    story, md = [], []
    for idx, (title, parts) in enumerate(pages):
        if idx: story.append(PageBreak())
        story.append(Paragraph(escape(title), styles['DocTitle']))
        md.append('# '+title+'\n')
        for kind, body in parts:
            story.append(Paragraph(escape(body).replace('\n','<br/>'), styles['SectionTitle' if kind=='h' else 'Copy']))
            md.append(('## ' if kind=='h' else '')+body+'\n')
    SimpleDocTemplate(str(OUT/(filename+'.pdf')), pagesize=(612,792), leftMargin=46,rightMargin=46,topMargin=43,bottomMargin=48, title=pages[0][0],author='Proyecto Alianza Servicios').build(story,onFirstPage=footer,onLaterPages=footer)
    (DOCS/(filename+'.md')).write_text('\n'.join(md),encoding='utf-8')

build('auditoria-privacidad', audit)
build('especificacion-fase-1', spec)
(DOCS/'inventario-datos.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf-8')
print('PDF y fuentes editables generados')
