# Piloto de Alianza Servicios

La aplicación emplea el diseño recibido de Alianza para el portal web. Expo mantiene una interfaz nativa con las mismas operaciones del expediente. El entorno local usa el proyecto ficticio `demo-alianza` y los emuladores de Authentication, Firestore y Storage. Los PDF internos y la imagen de referencia se usaron para comparar campos y paginación. Los datos cumplimentados de esos documentos quedan fuera de la aplicación y de las pruebas.

## Probar con cuentas ficticias

Instalar Node.js 22 LTS y Java 21. Desde la raíz ejecutar `npm ci` y `npm run test:rules`. Iniciar `npm run emulators` en otra terminal. En PowerShell, con los emuladores en marcha, ejecutar:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
node scripts/seed-emulators.mjs
```

En otra terminal, desde `app`, ejecutar `npm ci`, fijar `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` y abrir `npm run web`. Para Android Emulator, usar `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=10.0.2.2` si el dispositivo puede alcanzar el host por esa interfaz. Otra opción es `adb reverse tcp:9099 tcp:9099`, `adb reverse tcp:8080 tcp:8080`, `adb reverse tcp:9199 tcp:9199` y `adb reverse tcp:8081 tcp:8081`, con `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1`. El APK de prueba debe permitir la conexión HTTP local solo para emuladores. La versión de nube utiliza HTTPS.

| Rol | Correo ficticio | Paso |
| --- | --- | --- |
| Cliente | `client@example.test` | Crea un ticket y consulta el estado desde su cuenta. |
| Administrador | `admin@example.test` | Abre el ticket y asigna al técnico. |
| Técnico | `technician@example.test` | Captura diagnóstico, evidencia, costos, resultado y pruebas. Concluye el ticket. |

La contraseña compartida es `Demo-Alianza-2026!` y solo existe en la configuración local. Tras el cierre, el técnico asignado y el cliente creador pueden registrar su conformidad desde sus cuentas, cada uno en su propio bloque. El primer registro congela el contenido del expediente. Los dos co-responsables figuran en el formato y pueden tener referencias externas por ahora. Para un ticket creado por administración, el responsable deberá definirse antes de usar la conformidad del cliente en un piloto real. La confirmación autenticada registra nombre escrito, UID y fecha. Cualquier requisito de firma digital certificada debe acordarse con la empresa.

## Expediente y salidas

- Para la propuesta acepta PDF, PNG o JPG. Para antes y después acepta PNG o JPG. Cada posición admite un archivo de hasta 6 MB. El personal guarda los archivos explícitamente. Las reglas de Storage verifican el acceso al ticket en Firestore y bloquean modificaciones al cerrar el servicio.
- El archivo fuente de propuesta queda descargable en el expediente. El formato exportado conserva cuatro páginas. La página 2 muestra una vista proporcional de la primera hoja de un PDF de propuesta. El archivo completo, incluso si tiene varias hojas como el ejemplo recibido, se conserva como archivo adjunto dentro del exportado. Un lector sin soporte de adjuntos puede descargar el original desde la app.
- Un campo que supera el espacio disponible continúa en el texto adjunto al PDF. La distribución toma como referencia el formato de cuatro páginas. La aprobación visual del formato para uso operativo corresponde a Alianza.
- Los costos se calculan en MXN desde cantidades, precios y porcentaje de IVA. El valor inicial editable es 16 % y debe verificarse según el servicio. El resultado es una estimación del expediente, no un comprobante fiscal.

## Verificación local

Pasaron ESLint, TypeScript, la exportación web y la generación del paquete JavaScript de Android. Pasaron 21 pruebas de reglas de Firestore y Storage. El recorrido web con Authentication, Firestore y Storage locales cubrió la creación, asignación, diagnóstico, cálculo de costos, tres adjuntos, consulta por el cliente, cierre, dos conformidades, descarga del PDF y solicitud de privacidad. La verificación contra el proyecto en la nube se describe más abajo.

## Conectar el proyecto de la empresa

1. Confirmar el ID y la configuración pública del proyecto Firebase para pruebas. Habilitar correo y contraseña. Registrar la región de Firestore y del bucket. Mantener un proyecto separado del entorno de producción.
2. Configurar `app/.env` usando `.env.example`, incluido `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`. Desactivar el modo emulador. Antes del despliegue comprobar el proyecto de destino y revisar el costo y las cuotas de Storage.
3. Publicar reglas e índices para el proyecto de prueba con `firebase deploy --only firestore,storage --project ID_DE_PRUEBAS`. Habilitar el acceso entre las reglas de Storage y la instancia Firestore predeterminada. En web, configurar CORS del bucket para el origen de prueba, con las peticiones autenticadas de descarga. Verificar acceso con otro usuario del mismo tenant, uno de otro tenant y una sesión cerrada.
4. Crear perfiles por UID con la guía de Firebase. Usar cuentas ficticias y no reutilizar las claves locales de prueba. Verificar en un dispositivo Android y en la web con los mismos pasos de arriba.

## Validación en Firebase de pruebas

El proyecto `alianza-a1bc3` usa Firestore y el bucket `alianza-a1bc3.firebasestorage.app` en `us-central1`. Se publicaron los índices y las reglas de Firestore y Storage. Storage consulta Firestore mediante su cuenta de servicio para verificar el acceso de cada usuario al expediente. Se habilitó CORS para `http://localhost:8081` y `http://127.0.0.1:8091`, los orígenes del piloto local. Para un sitio publicado se debe agregar su origen HTTPS.

El recorrido web con las tres cuentas ficticias creó el folio `WR3MOgOweU5CZ9zti9KW` y verificó la asignación, el diagnóstico, los costos, la carga de la cotización y las dos imágenes, el cierre, ambas conformidades, la exportación del PDF y el registro de una solicitud de privacidad. Firebase rechazó una descarga sin sesión. El PDF resultante contiene cuatro páginas, la cotización original de tres páginas y las dos imágenes adjuntas.

En una ventana de 390 px, se verificó que el expediente completo mantiene el ancho de la pantalla y que el desplazamiento horizontal queda dentro de la tabla de costos.

En el emulador Android con Expo Go SDK 54, el cliente inició sesión en el proyecto de Firebase, abrió el mismo expediente concluido y generó el PDF con sus adjuntos. Se comprobó la apertura de la hoja de compartir de Android. Esta prueba nativa cubrió la consulta del cliente y la exportación. La captura y carga de archivos con el técnico se probaron en web.

## Aviso y solicitudes de privacidad

La pantalla Perfil registra solicitudes por tipo bajo `users/{uid}/privacyRequests`. La persona recibe un folio. La acción no revoca acceso ni borra datos automáticamente. Los documentos son visibles a la persona solicitante y se revisan por personal autorizado mediante las herramientas administrativas de Firebase. El piloto debe designar al responsable y el canal de atención antes de habilitar cuentas externas.

Para atender una baja, verificar identidad, listar la cuenta, perfil, tickets, conformidades, objetos de Storage y respaldos afectados. Determinar qué se debe suprimir o bloquear por conservación aplicable. Registrar la decisión y el alcance. Revocar sesiones, suprimir o anonimizar los datos autorizados desde un entorno administrativo, verificar el resultado y comunicarlo por el canal acordado. La eliminación de Firebase Authentication por sí sola deja los documentos y archivos de la aplicación.

Actualizar el aviso y las declaraciones del producto para cubrir Storage y sus metadatos, fotografías seleccionadas, registro de conformidad, fecha de cierre, solicitudes de privacidad y exportaciones locales. El piloto requiere una decisión sobre tratamiento de metadatos de las fotos, contenido de archivos, vínculos de descarga del proveedor y retención. Usar imágenes ficticias hasta que se aprueben los controles. La asistencia de IA y el empaquetado con Electron quedan para incrementos separados.
