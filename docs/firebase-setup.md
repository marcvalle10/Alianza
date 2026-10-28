# Crear y conectar Firebase

## Consola (primera configuración)

1. Entrar en https://console.firebase.google.com con la cuenta que conservará el proyecto.
2. Crear un proyecto llamado **Alianza Servicios**. Anotar el ID único; no se puede renombrar después. Google Analytics se puede dejar desactivado.
3. Registrar una aplicación **Web** con el botón `</>` y el nombre `alianza-app`. La app Expo utiliza Firebase JavaScript SDK. No hace falta activar Hosting.
4. Copiar el objeto `firebaseConfig`, disponible también en Configuración del proyecto > General > Tus apps > Configuración del SDK. Esta configuración es pública; no compartir contraseñas, tokens ni archivos de cuenta de servicio.
5. Authentication > Comenzar > Método de acceso: activar **Correo electrónico/contraseña**. No hace falta activar acceso mediante enlace por correo. En configuración de contraseñas establecer mínimo 12 caracteres para que el servidor también lo exija.
6. Firestore Database > Crear base de datos: elegir **Standard**, base `(default)`, modo **producción**, ubicación `us-central1` si está disponible. Registrar la ubicación real para la auditoría. La ubicación elegida no puede cambiarse en esa base.
7. No crear Storage ni activar Functions en esta etapa. No hace falta pasar a un plan de pago para probar este alcance dentro de las cuotas disponibles.

Referencias oficiales: [registro web](https://firebase.google.com/docs/web/setup), [acceso por contraseña](https://firebase.google.com/docs/auth/web/password-auth), [crear Firestore](https://firebase.google.com/docs/firestore/quickstart).

## Conectar el código

Copiar `.env.example` a `app/.env`. Completar API_KEY, AUTH_DOMAIN, PROJECT_ID y APP_ID desde firebaseConfig. Mantener `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false` para el proyecto real. No completar claves privadas de IA. Reiniciar Expo con `npm start -- --clear` desde `app`.

Antes de intentar guardar datos, publicar **firestore.rules** en la pestaña Reglas de Firestore. El modo producción inicial deniega operaciones; es el comportamiento esperado. Nunca sustituirlo por `allow read, write: if true`. No se han desplegado reglas automáticamente a ningún proyecto real.

## Activar una cuenta de prueba

1. Crear la cuenta desde la app y abrir el enlace de verificación recibido. Pulsar **Comprobar acceso**. Si el enlace no llegó, revisar spam y usar Reenviar verificación.
2. Un administrador del proyecto, desde la consola de Firestore, crea el documento `users/UID` (UID exacto de Authentication) con tres campos string:

```json
{ "tenantId": "empresa-demo", "role": "client", "name": "Cliente de prueba" }
```

Roles válidos: `client`, `technician`, `admin`. `tenantId` contiene entre 1 y 80 letras, números, guiones o guiones bajos. Una cuenta pertenece a una sola empresa en esta versión. Las cuentas con rol admin administran únicamente esa empresa, no todas las empresas del sistema. El personal que atienda varias empresas requerirá un modelo de membresías posterior.

Solo una persona autorizada con acceso a la consola puede provisionar usuarios. La app no permite crear ni modificar estos perfiles. Para asignar un servicio, el administrador utiliza el UID de un técnico del mismo tenant. Los clientes crean/consultan sus solicitudes; técnicos consultan/actualizan las asignadas; administradores consultan y asignan las de su empresa. Solo clientes y administradores crean reportes.

## Pruebas locales sin cuenta Firebase

Requisitos: Node 22 y Java 21 disponibles en PATH. Desde la raíz:

```sh
npm ci
npm run test:rules
npm run emulators
```

Para abrir la aplicación contra los emuladores, poner en `app/.env`:

```dotenv
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
```

En otra terminal ejecutar `cd app`, `npm ci`, `npm run web`. La interfaz de emuladores queda en `http://127.0.0.1:4000`. Los enlaces de verificación se imprimen en la terminal del emulador Authentication; no se envían correos reales. Crear perfiles de prueba en la pestaña Firestore del emulador. El proyecto se fija a `demo-alianza` en este modo: no utiliza recursos de producción. Para pruebas en un teléfono físico se necesita configurar de forma explícita la red local del emulador; el host de loopback predeterminado solo sirve para el equipo local.

## Si falla

- `auth/operation-not-allowed`: habilitar el proveedor correo/contraseña.
- `auth/invalid-api-key`: revisar firebaseConfig y reiniciar Expo.
- `permission-denied`: comprobar correo verificado, documento users/UID, tenantId y publicación de las reglas. No abrir la base al público.
- Cuenta espera activación: el perfil users/UID no existe o sus campos no son válidos.
- Técnico no ve reportes: deben estar asignados a su UID y al mismo tenant.
- Emulador no inicia: revisar Java 21, puertos 8080/9099/4000 y conexión para la descarga inicial.
- Firebase pide facturación al abrir Storage o Functions: cerrar ese paso; todavía no se utilizan.

Esta fase utiliza datos ficticios. La cuenta y los reportes del proyecto real sí persistirán en Firebase; la sesión y la caché local solo se mantienen en memoria. Al recargar se requiere iniciar sesión de nuevo.
