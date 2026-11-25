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

Pasaron ESLint, TypeScript, la exportación web y la generación del paquete JavaScript de Android. Pasaron 23 pruebas de reglas de Firestore y Storage. Incluyen acceso con dos empresas, asignación de técnicos activos, denegación entre empresas y suspensión de una membresía sin quitar la otra. El recorrido con los servicios locales cubrió la creación, asignación, diagnóstico, costos, archivos, cierre, conformidades, PDF y solicitud de privacidad.

## Conectar el proyecto de la empresa

1. Confirmar el ID y la configuración pública del proyecto Firebase para pruebas. Habilitar correo y contraseña. Registrar la región de Firestore y del bucket. Mantener un proyecto separado del entorno de producción.
2. Configurar `app/.env` usando `.env.example`, incluido `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`. Desactivar el modo emulador. Antes del despliegue comprobar el proyecto de destino y revisar el costo y las cuotas de Storage.
3. Para proyectos con perfiles previos, ejecutar la migración antes de publicar las reglas de Storage. Usar una cuenta administrativa autorizada con Application Default Credentials, desde la raíz, después de `npm ci`.

   ```sh
   node scripts/migrate-company-access.mjs ID_DE_PRUEBAS --check
   node scripts/migrate-company-access.mjs ID_DE_PRUEBAS --apply
   node scripts/migrate-company-access.mjs ID_DE_PRUEBAS --check
   firebase deploy --only firestore,storage --project ID_DE_PRUEBAS
   ```

   La primera revisión devuelve código 2 si hay accesos pendientes. La migración copia los perfiles válidos sin reemplazar accesos existentes. La revisión final debe mostrar cero pendientes. Habilitar el acceso entre las reglas de Storage y la base Firestore predeterminada y configurar CORS para el origen HTTPS autorizado.

4. Publicar Hosting desde la rama `codex/publicacion-alianza`. Desde la raíz, ejecutar `npm --prefix app run build:web` con la configuración de Firebase de prueba y luego `firebase deploy --only hosting --project ID_DE_PRUEBAS`.

## Altas y asignaciones

1. El propietario autorizado de Firebase valida la identidad y el correo verificado de la persona designada para altas. Crea un documento en `alianzaAdmins` con su UID exacto como ID. Puede usar el campo `designacion: "Administración de accesos"`. Solo un operador con acceso administrativo a Firebase puede crear o retirar ese permiso general.
2. Cada persona se registra con su correo, verifica el enlace y entrega su UID al personal autorizado de Alianza. El administrador comprueba por un canal de la empresa que el UID corresponde al correo verificado y a la persona que debe recibir acceso.
3. En **Usuarios y permisos**, el administrador autorizado crea o elige la empresa, captura el UID, el nombre y el rol, y guarda. Para asignar otra empresa, repite el registro con el mismo UID. Para suspender o reactivar, elige primero la empresa correspondiente.
4. El personal cambia la empresa desde Inicio. El administrador de esa empresa asigna cada ticket a un técnico activo de la misma. El técnico consulta sus tickets asignados. El cliente consulta sus propios reportes.

El permiso general de altas permite gestionar empresas y accesos. Cada expediente requiere además el rol aplicable en su empresa. La baja por empresa suspende esa membresía. Para una baja total, revisar todas las membresías, revocar las sesiones y atender la conservación de los expedientes por separado.

## APK de revisión

El perfil EAS `preview` genera un APK Android con el identificador `com.alianzainformatica.servicios` y el logotipo de Alianza. La cuenta u organización mantenedora debe tener acceso al proyecto EAS y conservar la clave de firma y su respaldo autorizado. Instalar futuras actualizaciones del mismo identificador exige la misma clave.

Desde `app`, iniciar sesión con la cuenta mantenedora y vincular el proyecto EAS correspondiente. Configurar las variables `EXPO_PUBLIC_FIREBASE_*` del entorno EAS `preview` para el proyecto Firebase de pruebas y `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false`. Confirmar los valores antes de compilar. Los archivos `.env` locales están ignorados por Git y las credenciales de firma se guardan aparte.

```sh
npx eas-cli@latest whoami
npx eas-cli@latest build --platform android --profile preview
```

Si el registro de npm no resuelve una dependencia de la versión actual, `eas-cli@18.0.1` es la versión que se comprobó que arranca para iniciar sesión en este entorno. Una vez descargada la APK, instalarla en un teléfono y validar inicio de sesión, cambio de empresa, asignación, fotos y exportación. [Distribución de APK con EAS](https://docs.expo.dev/build-reference/apk/)

## Validación en Firebase de pruebas

El proyecto `alianza-a1bc3` usa Firestore y el bucket `alianza-a1bc3.firebasestorage.app` en `us-central1`. Storage consulta Firestore mediante su cuenta de servicio para verificar acceso. CORS permite `https://alianza-a1bc3.web.app` y los dos orígenes del piloto local. Para otro sitio, agregar el origen exacto y conservar los orígenes que sigan en uso.

La [web publicada](https://alianza-a1bc3.web.app) se probó con tres cuentas ficticias. El cliente creó el folio `Uoo2VYz8eUKFWb3wUHL6`, administración lo asignó, el técnico subió los tres adjuntos y lo concluyó. Se verificó la descarga autenticada, el rechazo sin sesión, las dos conformidades, el PDF de cuatro páginas y el folio de privacidad. [CI de la versión publicada](https://github.com/marcvalle10/Alianza/actions/runs/45588128774)

El recorrido web con las tres cuentas ficticias creó el folio `WR3MOgOweU5CZ9zti9KW` y verificó la asignación, el diagnóstico, los costos, la carga de la cotización y las dos imágenes, el cierre, ambas conformidades, la exportación del PDF y el registro de una solicitud de privacidad. Firebase rechazó una descarga sin sesión. El PDF resultante contiene cuatro páginas, la cotización original de tres páginas y las dos imágenes adjuntas.

En una ventana de 390 px, se verificó que el expediente completo mantiene el ancho de la pantalla y que el desplazamiento horizontal queda dentro de la tabla de costos.

En el emulador Android con Expo Go SDK 54, el cliente inició sesión en el proyecto de Firebase, abrió el mismo expediente concluido y generó el PDF con sus adjuntos. Se comprobó la apertura de la hoja de compartir de Android. Esta prueba nativa cubrió la consulta del cliente y la exportación. La captura y carga de archivos con el técnico se probaron en web.

## Aviso y solicitudes de privacidad

La pantalla Perfil registra solicitudes por tipo bajo `users/{uid}/privacyRequests`. La persona recibe un folio. La acción no revoca acceso ni borra datos automáticamente. Los documentos son visibles a la persona solicitante y se revisan por personal autorizado mediante las herramientas administrativas de Firebase. El piloto debe designar al responsable y el canal de atención antes de habilitar cuentas externas.

Para atender una baja, verificar identidad, listar la cuenta, perfil, tickets, conformidades, objetos de Storage y respaldos afectados. Determinar qué se debe suprimir o bloquear por conservación aplicable. Registrar la decisión y el alcance. Revocar sesiones, suprimir o anonimizar los datos autorizados desde un entorno administrativo, verificar el resultado y comunicarlo por el canal acordado. La eliminación de Firebase Authentication por sí sola deja los documentos y archivos de la aplicación.

Actualizar el aviso y las declaraciones del producto para cubrir Storage y sus metadatos, fotografías seleccionadas, registro de conformidad, fecha de cierre, solicitudes de privacidad y exportaciones locales. El piloto requiere una decisión sobre tratamiento de metadatos de las fotos, contenido de archivos, vínculos de descarga del proveedor y retención. Usar imágenes ficticias hasta que se aprueben los controles. La asistencia de IA y el empaquetado con Electron quedan para incrementos separados.

Consultar la [propuesta de privacidad y operación](privacidad-operacion.md) para aprobar los plazos y asignar responsables antes de usar datos reales.
