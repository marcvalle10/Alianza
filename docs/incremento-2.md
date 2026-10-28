# Incremento 2: acceso y seguimiento de servicios

La entrega de fase 1 y su auditoría describen el prototipo local de esa fecha. Este incremento añade código para Firebase Authentication y Firestore, pendiente de configurar y probar contra el proyecto del propietario. No equivale a un despliegue de producción.

## Alcance implementado

- Expo Router: acceso, formato demo, listado, nuevo reporte y detalle.
- Registro por correo, verificación, recuperación y cierre de sesión.
- Activación manual de perfiles y aislamiento por empresa en reglas de Firestore.
- Reportes con datos de cliente/equipo/solicitud; consulta, búsqueda y filtro por estado.
- Asignación de técnico por administrador y actualización de diagnóstico, trabajo, resultado y pruebas finales.
- Validaciones del servidor y pruebas de reglas con identidades simuladas.

El formulario conectado implementa el levantamiento y seguimiento inicial, no todos los apartados del PDF. La demo conserva el esquema completo de referencia. Cotización como imagen, fotografías antes/después, cuatro firmas, exportación de diseño exacto y Electron siguen pendientes. Los folios son IDs de Firestore; no se ha definido una numeración documental consecutiva.

## Cambios para la auditoría de privacidad

| Dato | Captura y finalidad | Destino y controles | Retención/borrado |
|---|---|---|---|
| Correo y contraseña | Acceso obligatorio; autenticación y recuperación | Firebase Auth tras abrir acceso y enviar formulario. No se escribe contraseña en Firestore ni logs de la app. Verificación de correo obligatoria para tickets. | Cuenta persiste hasta eliminación administrativa; no hay autoservicio de borrado todavía. |
| UID, correo verificado | Generados por Auth; relacionar permisos | Firebase Auth y reglas; perfil users/UID creado en consola | Perfil y cuenta requieren eliminación coordinada. |
| Empresa, rol, nombre de perfil | Administrador del proyecto; limitar acceso | Firestore, no modificable desde la app | Política de baja pendiente de automatizar. |
| Empresa/cliente, contacto, correo, equipo y descripción | Nuevo reporte; obligatorios para solicitar servicio | Firestore al confirmar y enviar; acceso por tenant/creador/asignación | Retención propuesta de fase 1; sin purga automática. |
| RFC, orden, teléfono, domicilio, área, ubicación, marca/modelo/serie/cantidad | Opcionales; solo si el servicio los necesita | Mismo expediente Firestore; sin permiso de GPS ni contactos del dispositivo | Minimizar su captura. Pendiente borrado administrativo documentado. |
| Prioridad y tipo de atención | Nuevo reporte; clasificación operativa | Firestore, valores enumerados | Mismo expediente. |
| Técnico asignado, diagnóstico, trabajo, resultado, pruebas y motivo | Gestión por personal autorizado | Firestore; cliente consulta su avance | Mismo expediente. |
| Fechas de creación/actualización | Servidor; seguimiento | Firestore serverTimestamp | Mismo expediente. |

El SDK Firebase puede tratar metadatos técnicos necesarios para conexión y autenticación. No se agregan Analytics, Crashlytics, notificaciones, pagos ni proveedores de IA. No se ha verificado tráfico de un proyecto real. La ubicación de Firestore se debe registrar al crear la base; no asumir que todos los servicios Firebase procesan en la misma región. La auditoría de fase 1 contiene la evaluación preliminar de proveedores y transferencias.

Antes de abrir la conexión se explica el envío a Firebase; antes de enviar el reporte se solicita confirmación desmarcada. Son controles de una prueba, no una declaración de cumplimiento legal ni un aviso de privacidad aprobado. Falta formalizar la base aplicable, el aviso integral y un registro de su versión/aceptación para producción. No existen etiquetas publicadas en tiendas que se puedan contrastar.

## Límites de esta versión

Una cuenta tiene un tenant; el equipo que atienda varias empresas necesita membresías múltiples. No hay historial inmutable de cada cambio, prevención de edición concurrente, paginación del listado, adjuntos, notificaciones, borrado ARCO ni retención automática. Las actualizaciones simultáneas usan el último guardado. Cerrar un ticket requiere resultado y pruebas, pero aún no firmas. Las alertas de dependencias identificadas en fase 1 no se consideran resueltas por este incremento.

Las pruebas de reglas verifican aislamiento y restricciones del servidor; no sustituyen una prueba completa de interfaces, envío real de correos, accesibilidad ni dispositivos Android/iOS. La prueba en el proyecto Firebase real sigue pendiente de su creación y configuración.

## Evidencia local

Linter y TypeScript aprobados. Exportación web generada con Expo Router. Firestore Emulator con Java 21 ejecutó 13 pruebas: 13 aprobadas, 0 fallidas. Incluyen aislamiento entre tenants/clientes, acceso por asignación, prohibición de autoasignarse roles, validación de campos, timestamps, cierre y prohibición de borrado.

El análisis completo de npm posterior a la integración reportó 44 alertas agregadas (7 bajas, 17 moderadas, 17 altas y 3 críticas), antes de una actualización compatible adicional. El resumen rápido del instalador mostró cifras distintas; no usarlo como medida de vulnerabilidad explotable. Requieren evaluación de alcance y corrección antes de datos reales; no se declara que la actualización adicional haya resuelto todas las alertas. La herramienta de emulación tiene su propio árbol de dependencias y no se distribuye dentro de la app.
