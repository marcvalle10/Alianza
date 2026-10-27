# Auditoría preventiva de privacidad

Alianza Servicios | Aplicación de tickets de Alianza Informática
Actividad 1 · 26 de octubre de 2026 · Versión 1.0

## Objeto y conclusión

El proyecto permitirá a clientes solicitar trabajos y al personal gestionar servicios pendientes, en proceso y concluidos. Esta auditoría identifica los datos del formato AI_SERVICIO_0001.pdf y los flujos previstos de la solución Expo, Firebase y backend Node.js. El mercado inicial asumido es México.

El resultado es una auditoría de diseño, no una certificación de una app desplegada. El prototipo de fase 1 captura campos en memoria local. No integra Firebase ni una API de IA, no tiene usuarios reales y no cuenta con publicaciones en tiendas. No se ha realizado una inspección de tráfico de una versión móvil instalada.

## Evidencia examinada

Se revisaron visualmente las cuatro páginas del formato, incluida la cotización incorporada como imagen, fotos y bloques de firma. El código inicial conserva la secuencia 1 a 8 y 10. El PDF contiene datos reales; su contenido cumplimentado, fotografías y datos de contacto no se copian al repositorio ni a ejemplos.

## Regla de lectura del inventario

D identifica cada grupo de datos relacionados. Cada campo se enumera expresamente. F identifica el destino, B la base o autorización prevista y R la retención propuesta. La obligatoriedad corresponde al diseño funcional futuro: el prototipo todavía no valida los requisitos por etapa. Todos los controles de nube y consentimiento descritos están pendientes de implementación.

## Límites de la primera versión

No se prevé recopilar GPS, agenda, audio, publicidad, identificadores publicitarios, biometría, datos de salud o tarjetas. Sí se contemplan domicilios escritos, fotos, costos y firmas. Preservar campos del formato no exige capturarlos cuando no son pertinentes; se admite No aplica según la operación.

# Inventario de cuentas y solicitud

## D01 Cuenta

Correo de acceso, contraseña y UID.
Captura: Registro e inicio de sesión; obligatorios para una cuenta futura.
Uso y minimización: Autenticar y recuperar acceso. La contraseña se entrega únicamente a Authentication; nunca se copia a Firestore ni a registros.
Destino, base y retención: F1; B1; R1.

## D02 Perfil y acceso

Nombre, empresa, tenantId, rol y técnico asignado.
Captura: Perfil y administración; obligatorios. Rol y tenantId los establece el administrador, no el cliente.
Uso y minimización: Separar empresas y limitar acceso. Necesarios; no solicitar identificación oficial.
Destino, base y retención: F2; B1; R1 y R3 para la asignación histórica.

## D03 Control del servicio

Folio, fecha de solicitud, fecha de terminación y número de orden o referencia.
Captura: Encabezado y apartado 1; folio y fecha inicial automáticos; cierre obligatorio al concluir; orden opcional.
Uso y minimización: Trazabilidad del trabajo. No incluir nombres o correos en el folio.
Destino, base y retención: F2; B1; R3.

## D04 Identificación del cliente

Empresa o cliente y RFC.
Captura: Apartado 1; nombre obligatorio; RFC solo si la operación fiscal o contractual lo requiere.
Uso y minimización: Identificar al solicitante y su referencia fiscal. Conservar el campo, pero no exigir RFC para levantar una incidencia.
Destino, base y retención: F2; B1 y B2 cuando corresponda; R3, o R4 si forma parte de documentación fiscal.

## D05 Contacto del servicio

Contacto responsable, teléfono y correo electrónico.
Captura: Apartado 1; responsable y un medio de contacto obligatorios; teléfono opcional si basta el correo.
Uso y minimización: Coordinar visita y aclaraciones. Reutilizar datos confirmados de la cuenta; no leer agenda del dispositivo.
Destino, base y retención: F2; B1; R3.

## D06 Localización manual

Domicilio del servicio, área o departamento, ubicación específica y ubicación del equipo.
Captura: Apartados 1 y 3; obligatorios para visita física; opcionales o No aplica para soporte remoto.
Uso y minimización: Encontrar el lugar de trabajo. Captura manual, sin GPS ni seguimiento continuo.
Destino, base y retención: F2; B1; R3.

## D07 Clasificación

Tipo de atención, prioridad y estado del servicio.
Captura: Apartado 2; obligatorios. Cliente solicita prioridad; personal confirma la gestión.
Uso y minimización: Organizar la atención. Conservar Pendiente, En proceso, Concluido y Requiere seguimiento.
Destino, base y retención: F2; B1; R3.

# Inventario del trabajo y evidencias

## D08 Activos

Equipo o sistema, marca, modelo, número de serie o inventario y cantidad.
Captura: Apartado 3; equipo o sistema requerido; demás campos condicionales según el servicio.
Uso y minimización: Diagnóstico e identificación del activo. Evitar inventariar equipos ajenos al trabajo.
Destino, base y retención: F2; B1; R3.

## D09 Solicitud y diagnóstico

Descripción de falla, necesidad o alcance y diagnóstico técnico o causa probable.
Captura: Apartado 4; solicitud obligatoria; diagnóstico al atender, no al crear.
Uso y minimización: Entender y resolver la incidencia. No registrar contraseñas, accesos físicos, salud ni documentos personales.
Destino, base y retención: F2; B1; R3. Solo una copia revisada y sin identificadores podría usar F4 con B3.

## D10 Trabajo realizado

Actividades marcadas, texto de Otro y detalle del trabajo realizado.
Captura: Apartado 5; obligatorio al documentar la atención; Otro solo al seleccionarlo.
Uso y minimización: Dejar evidencia técnica. Limitar nombres de terceros y detalles de seguridad innecesarios.
Destino, base y retención: F2; B1; R3.

## D11 Propuesta económica

Archivo de cotización: fabricante, modelo, cantidad, descripción, precio unitario, subtotal, tiempo de entrega, IVA, total, moneda y condiciones de pago, validez y entrega cuando aparezcan en el documento.
Captura: Apartado 6; condicional si existe propuesta.
Uso y minimización: Respaldar una autorización económica. La propuesta del ejemplo es una imagen adjunta; no se reconstruye ni altera su tabla.
Destino, base y retención: F3 para archivo y F2 para referencia; B2; R4.

## D12 Evidencias

Fotos Antes y Después, etiquetas o serie, capturas o reporte, archivos, nombre o referencia, enlace y observaciones.
Captura: Apartado 6 y continuación en página 3; opcionales salvo evidencia necesaria del trabajo.
Uso y minimización: Documentar el servicio. Elegir archivos puntuales, quitar EXIF y evitar caras, placas y credenciales. No subir toda la galería.
Destino, base y retención: F3 y F2 para metadatos; B1 más selección y aviso de carga; R5.

## D13 Resultado

Resultado marcado, pruebas finales, motivo de no realización, observaciones y recomendaciones.
Captura: Apartado 7; resultado y pruebas al cierre; motivo obligatorio si no se realizaron.
Uso y minimización: Informar el estado real del servicio y limitaciones. No inferir resultados mediante IA.
Destino, base y retención: F2; B1; R3.

# Inventario de cierre y datos técnicos

## D14 Seguimiento

Acción requerida, fecha propuesta de próxima visita y responsable del seguimiento.
Captura: Apartado 7; condicional si existe seguimiento.
Uso y minimización: Coordinar pendientes. Sin importar calendarios ni contactos personales.
Destino, base y retención: F2; B1; R3.

## D15 Costos adicionales

Concepto, cantidad, precio unitario, importe, subtotal, IVA, total en MXN y condiciones o autorización de costos; incluye mano de obra, materiales o refacciones y traslado u otros.
Captura: Apartado 8; solo si aplican. Mantener No aplican.
Uso y minimización: Registrar costos, no procesar pagos. No recolectar tarjetas, CLABE ni credenciales bancarias.
Destino, base y retención: F2; B2; R4.

## D16 Conformidad

Nombre, cargo, empresa, firma y correo de prestador, responsable y dos corresponsables.
Captura: Apartado 10; según participación efectiva. No obligar a inventar cuatro firmantes si no existen.
Uso y minimización: Acreditar recepción conforme al texto original. Firma gráfica, sin análisis biométrico de presión o velocidad. No equivale a consentimiento de IA.
Destino, base y retención: F2 para identidad y F3 para firma; B1; R3 o R4 si integra documento contractual.

## D17 Seguridad y preferencias

UID, evento de acceso o cambio, fecha, versión del aviso, selección de consentimiento y revocación; IP y datos técnicos tratados por servicios.
Captura: Sistema y preferencias; eventos mínimos necesarios, consentimiento de IA opcional.
Uso y minimización: Auditar acceso y decisiones. No guardar contenido completo ni tokens en logs; sin publicidad ni analítica de comportamiento.
Destino, base y retención: F5; B1 y B3 para la evidencia de elección; R6 y R7.

## D18 Sesión y borradores

Token de sesión y campos en edición.
Captura: Dispositivo; necesarios mientras se usa la app. En el prototipo solo existen campos en memoria, no tokens.
Uso y minimización: Mantener trabajo y sesión. En producción usar almacenamiento seguro y limpiar al salir; caché persistente desactivada inicialmente.
Destino, base y retención: F0, con token emitido por F1; B1; R0.

## D19 Asistencia de IA

Extracto técnico revisado, categoría sugerida, resumen y registro mínimo de aceptación.
Captura: Botón de asistencia futuro; completamente opcional.
Uso y minimización: Sugerir organización del ticket. No enviar RFC, domicilio, contactos, firmas, fotos, precios, folio o tenantId al modelo. No modificar el formato original.
Destino, base y retención: F4; B3; R8. Proveedor, país y retención contractual pendientes; bloqueado hasta definirlos.

# Flujos y servicios receptores

## F0 y F1 Dispositivo y autenticación

F0: campos en memoria del dispositivo; en la demo no existe envío programado por la app. F1 futuro: dispositivo > Firebase Authentication, operado por Google en Estados Unidos, para correo, contraseña, UID y datos técnicos de acceso. La selección de otra región de base de datos no cambia esta ubicación de Authentication [2].

## F2 y F3 Expedientes y archivos

F2 futuro: app > Cloud Firestore, y operaciones privilegiadas > Cloud Functions con Node.js > Firestore. F3 futuro: app > Cloud Storage para archivos y firmas; Firestore mantiene referencias. Propuesta de residencia: us-central1, Estados Unidos, para base, bucket y funciones compatibles. La región no ha sido configurada y debe verificarse por recurso; infraestructura y subencargados pueden tener tratamientos adicionales [2, 3].

El backend pertenece lógicamente al proyecto de la empresa, pero está alojado por Google. Usuarios de una empresa solo verán expedientes autorizados de esa empresa; técnicos, los asignados; administradores, lo necesario para su función. El SDK cliente no debe decidir roles ni confiar en un tenantId enviado sin validación.

## F4 Asistencia externa de IA

Futuro: vista previa revisada por el usuario > backend Node.js que verifica identidad, permiso y consentimiento > API de IA aprobada > sugerencia al usuario. No existe proveedor contratado ni país confirmado. No se habilitará este flujo hasta definir contrato, subencargados, región, retención y exclusión de entrenamiento que correspondan. El modelo no recibe acceso directo a Firestore o Storage.

## F5 Seguridad y consentimiento

Eventos mínimos > Firestore y registros de backend. Aplicar la misma región propuesta cuando sea configurable; verificar ubicación y retención de Cloud Logging y de datos de servicio de Google. No prometer que los registros del proveedor se borran con el ticket.

## Inventario de SDK y API

Activos: Expo, React y React Native para interfaz; ningún SDK de IA ni Firebase instalado. Previstos: Firebase JS SDK para Auth, Firestore y Storage; Firebase Admin solo en backend con privilegios mínimos. API de IA sin seleccionar. Analytics, Crashlytics, FCM, reconocimiento facial, mapas y MCP quedan fuera de la fase 1. Expo Go y herramientas de desarrollo no son una build de producción; revisar sus prácticas por separado antes de probar con datos reales.

# Base jurídica y autorizaciones

## Marco territorial

Para la operación privada en México se toma como referencia la LFPDPPP vigente. Antes del piloto se debe confirmar la razón social responsable, domicilio y canal ARCO, así como las obligaciones frente a las empresas clientes. GDPR, CCPA y LGPD no se consideran automáticamente aplicables por usar Firebase; reevaluar alcance territorial y umbrales si se atienden personas o mercados de la UE, California o Brasil.

## B1 Servicio y cuenta

Para D01 a D10, D12 a D14, D16 a D18: informar finalidades antes de captar datos y documentar consentimiento o la excepción aplicable a una relación jurídica, cuando realmente se cumpla. La relación de la empresa cliente no autoriza por sí sola cualquier dato de sus empleados. Registrar fuente y autorización de contactos y firmantes aportados por terceros [1].

## B2 Información económica

Para RFC y D11/D15, valorar si hay datos de personas físicas de carácter financiero o patrimonial; en ese supuesto se requiere consentimiento expreso salvo excepción legal documentada. La información de una persona moral no siempre es dato personal, pero sus contactos y firmas sí pueden identificar personas [1].

## B3 Asistencia opcional

Consentimiento separado, no premarcado y revocable antes del envío a IA; explicar finalidad, destinatario, país, datos exactos y retención. Permitir trabajar sin IA. La firma de recepción del apartado 10 y el permiso de cámara no sustituyen este consentimiento. Guardar versión, fecha, usuario y alcance aceptado.

## Salidas sin autorización clara

No se ha confirmado una salida no autorizada del prototipo. Riesgos futuros prioritarios: RIESGO A, inicializar servicios antes de informar al usuario; RIESGO B, enviar tickets completos a IA; RIESGO C, subir adjuntos o EXIF automáticamente; RIESGO D, invitar contactos o publicar archivos con enlaces abiertos; RIESGO E, compartir tickets entre empresas. Todos deben quedar bloqueados antes del piloto.

## Verificación requerida

Capturar tráfico con datos ficticios: abrir app sin aceptar; crear cuenta; adjuntar foto; rechazar IA; aceptar un único envío; revocar; cerrar sesión. Comparar destinos y campos con F0 a F5. Guardar evidencias sin secretos. Revisar contrato de encargado con Google y condiciones de cualquier proveedor adicional [3].

# Minimización retención y borrado

Los siguientes plazos son decisiones propuestas para aprobación del responsable, no plazos legales universales ni configuraciones ya activas. La tabla D remite a estos códigos para cubrir cada dato.

## R0 y R1 Sesión y cuenta

R0: campos de la demo hasta cerrar o recargar; en producción, token hasta expiración o revocación, limpiar sesión al salir. Borradores futuros: máximo 7 días o borrado manual. R1: perfil mientras la cuenta esté activa; eliminación operativa en hasta 30 días tras solicitud validada, salvo conservación justificada de referencias históricas.

## R3 y R4 Expediente y costos

R3: expediente técnico hasta 24 meses desde el cierre; revisar necesidad al vencer garantía o contrato. R4: documentación contractual o fiscal, plazo determinado por obligación y prescripción aplicables antes del piloto; propuesta inicial de revisión a 5 años, sujeta a validación contable y jurídica. La suspensión por litigio debe tener motivo, responsable, fecha y revisión; no habilita conservación indefinida.

## R5 a R8 Adjuntos y trazabilidad

R5: evidencias hasta 12 meses tras cierre, salvo las mínimas que deban integrarse al expediente contractual. R6: logs operativos 90 días. R7: evidencia de aviso y consentimiento mientras dure el tratamiento más 24 meses, sujeto a prescripción aplicable. R8: texto enviado a IA sin persistencia en backend; sugerencia aceptada bajo R3; historial de prompts desactivado. Retención del proveedor de IA pendiente: no activarlo hasta conocerla.

## Proceso de borrado propuesto

Solicitud desde perfil o canal ARCO > comprobar identidad proporcionalmente > localizar UID, tickets, adjuntos y copias > determinar bloqueo o excepción > revocar sesiones > borrar Auth, Firestore, subcolecciones, archivos y referencias > confirmar resultado. Borrar la cuenta de Auth no elimina por sí solo los tickets ni Storage. Un trabajador que deja una empresa no puede borrar unilateralmente todo el expediente empresarial.

Configurar purga de respaldos en un máximo operativo propuesto de 30 días, sujeto a capacidades y políticas de cada servicio. Mantener una lista mínima de borrados para evitar reintroducción al restaurar. Gestionar descargas locales y archivos exportados; la empresa debe informar los límites de eliminación de copias entregadas legítimamente a terceros.

## Datos a eliminar o evitar

Excluir EXIF, duplicados, imágenes no pertinentes, datos de terceros en texto libre, tokens en logs y copias de contraseñas. Mantener opcionales RFC, teléfono secundario y firmas no participantes. Restringir campos económicos y firmas a quienes los necesiten. Todas las tareas de purga y solicitudes ARCO siguen sin implementar.

# Declaraciones públicas y plan de corrección

## Comparación con el comportamiento observado

Política publicada: no existe evidencia de una política de esta app. Apple App Privacy y Google Data Safety: no existen fichas publicadas aportadas. Comportamiento del prototipo: captura local sin integración de nube. Por tanto, no es posible afirmar coincidencia o discrepancia frente a declaraciones inexistentes. La ausencia de aviso y fichas es una brecha de preparación para el lanzamiento, no prueba de una declaración falsa.

## Declaraciones que corresponderán a producción

Preparar categorías de contacto, identificadores de cuenta, contenido del usuario, fotos, dirección escrita y datos económicos cuando identifiquen personas; incluir datos técnicos realmente tratados. Muchos estarán vinculados a la cuenta. Finalidades: funcionalidad, gestión de cuentas y seguridad. No marcar No se recopilan datos si se usa la arquitectura de nube [4, 5].

Evaluar por separado la definición de recopilación de Apple y Google, y las excepciones de compartición por proveedor de servicios en Google Play. Una dirección escrita no equivale a GPS: clasificar conforme a las preguntas exactas de cada tienda. El diseño no contempla publicidad, venta de datos ni seguimiento entre apps; comprobar SDK y tráfico antes de declararlo [4, 5].

## Acciones antes de usuarios reales

Prioridad crítica: responsable y canal ARCO; aviso accesible; aprobación de retención; Firebase con reglas por empresa y rol; pruebas de aislamiento; servicios externos configurados y documentados. Prioridad alta: carga selectiva y sin EXIF, borrado integral, bloqueo de IA no autorizada y revisión de texto libre. Antes de tiendas: conciliar aviso, build final y etiquetas; registrar evidencia y fecha de revisión.

## Responsables y aceptación

La dirección de Alianza aprueba finalidad, retención y proveedores; desarrollo implementa y prueba controles; administración atiende derechos con apoyo jurídico cuando corresponda. Aceptación: cliente A no accede al ticket ni archivo de B; técnico no cambia roles; rechazar IA produce cero llamadas al proveedor; eliminar cuenta ejecuta la política de retención; exportación no expone datos a enlaces públicos.

## Fuentes consultadas el 26 de octubre de 2026

[1] LFPDPPP, arts. 7, 8, 9 y 10: https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo125102.html
[2] Firebase Privacy and Security: https://firebase.google.com/support/privacy
[3] Firebase Data Processing and Security Terms: https://firebase.google.com/terms/data-processing-terms
[4] Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
[5] Google Play Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469
