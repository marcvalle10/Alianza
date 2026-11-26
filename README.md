# Alianza Servicios

**Entrega académica:** [documentación final, diagramas y evidencias](docs/entrega-final/README.md) · [catálogo de demostración](docs/datos-demostracion.md) · [aplicación web publicada](https://alianza-a1bc3.web.app/).

Aplicación de tickets para Alianza Informática. Los clientes solicitan servicios y el personal gestiona el diagnóstico, la evidencia y la conclusión del trabajo. Se puede probar con cuentas ficticias en Firebase Emulator Suite.

## Estado actual

- Expo y TypeScript en `/app`.
- Esquema de campos del formato de servicio, con apartados 1 a 8 y 10.
- Registro, verificación de correo y recuperación de acceso con Firebase Authentication.
- Captura y consulta de tickets en Firestore con permisos por empresa, cliente y técnico asignado.
- Asignación por administrador y seguimiento de diagnóstico, trabajo y resultado.
- Altas por UID, acceso a varias empresas y suspensión por empresa desde Usuarios y permisos. El permiso de altas se otorga a administradores autorizados de Alianza.
- Demo del formato completo en `/demo`, temporal en memoria.
- Propuesta adjunta, fotos de antes y después, costos calculados y conformidad autenticada para el prestador y el cliente creador.
- PDF de cuatro páginas con estructura del formato original y archivos adjuntos. La asistencia de IA sigue desactivada.
- Auditoría preventiva y especificación en `/docs`.
- Workflow de CI y plantilla de pull request.

El piloto web está en [Alianza Servicios](https://alianza-a1bc3.web.app). La [guía del piloto](docs/piloto-alianza.md) cubre la publicación, las cuentas y Android. La [entrega de Fase 1](docs/estado-entrega.md) documenta esa versión.

## Requisitos e instalación

Usar Node.js 22 LTS y npm. Desde la raíz:

```sh
cd app
npm ci
npm run web
```

Para desarrollo móvil:

```sh
npm start
```

Utilizar un cliente de desarrollo compatible con Expo SDK 54 o una versión compatible de Expo Go. Una versión reciente de Expo Go puede no admitir un SDK anterior. Android puede probarse en emulador o dispositivo; no se ha verificado una compilación nativa en esta entrega.

Para las comprobaciones del pipeline:

```sh
cd app
npm run lint
npm run typecheck
npm run build:web
```

La salida web se genera en `app/dist`. Firebase Hosting tiene configuradas las rutas de Expo Router. La demo usa memoria, los tickets se guardan en Firestore y la sesión se conserva en memoria.

## Configuración y secretos

Sin `.env`, la app muestra conexión pendiente y permite abrir la demo. Para conectar Firebase, copiar las variables públicas de `.env.example` a `app/.env`, habilitar Authentication, Firestore y Storage y seguir la [guía de piloto](docs/piloto-alianza.md). Las cuentas se activan con un perfil autorizado asignado por UID. Las claves de backend se conservan fuera del cliente y del repositorio.

Para probar permisos sin proyecto real, instalar Node 22 y Java 21 y ejecutar desde la raíz:

```sh
npm ci
npm run test:rules
```

Para iniciar el entorno local interactivo, ejecutar `npm run emulators`. Configurar `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` en `app/.env`. La [guía de piloto](docs/piloto-alianza.md) incluye el alta y recorrido de las tres cuentas ficticias de `demo-alianza`.

## Arquitectura prevista

Expo para Android, iOS y web; Firebase Authentication para acceso por correo; Firestore para expedientes; Storage para imágenes y documentos; Cloud Functions con Node.js para operaciones privilegiadas e IA. Electron es una extensión posterior de escritorio. MCP no es necesario en esta fase.

La asistencia de IA permanece pendiente y desactivada. Requiere proveedor, región, contrato y consentimiento separados. Nunca enviar automáticamente el expediente completo.

## Formato y privacidad

El expediente se edita en una sola vista. El PDF conserva cuatro páginas y la numeración de los apartados. Para una propuesta PDF de varias páginas, el exportado muestra la primera página e incorpora el archivo completo como adjunto. La conformidad autenticada requiere una acción explícita y bloquea cambios posteriores al expediente.

Usar datos ficticios durante las pruebas. El perfil registra un folio para solicitudes de privacidad. La revisión y supresión coordinada son tareas administrativas. El aviso y los plazos en `/docs` requieren aprobación antes del piloto con usuarios reales.

## Git y CI

Ramas: `main` y `develop`. Convención: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`, etc. Ejemplo: `feat: add ticket status filters`.

CI valida commits, instala desde ambos lockfiles, ejecuta linter, TypeScript, exportación web y pruebas de reglas con los emuladores de Firestore y Storage. `main` se integra mediante PR y el check `quality`. Consulta la [guía de GitHub](docs/github-configuracion.md).

## Documentos

- [Especificación de fase 1](docs/especificacion-fase-1.md)
- [Auditoría de privacidad](docs/auditoria-privacidad.md)
- [Inventario estructurado](docs/inventario-datos.json)
- [Configuración de Firebase](docs/firebase-setup.md)
- [Incremento 2 y cambios de privacidad](docs/incremento-2.md)
- [Piloto de Alianza con cuentas ficticias](docs/piloto-alianza.md)

Los PDF de entrega se generan localmente en `output/pdf` mediante `scripts/build_documents.py` con Python y ReportLab; esa carpeta está excluida de Git. Las fuentes Markdown sí se versionan.

## Decisiones de compatibilidad

La plantilla reciente falló por dependencias no publicadas en el registro disponible. Se seleccionó Expo SDK 54, ESLint 9.25.0 y typescript-eslint 8.46.1. La resolución inicial usó una fecha de corte del 1 de febrero de 2026; las instalaciones posteriores deben usar `npm ci` con el lockfile. Revisar las alertas de seguridad registradas en el estado de entrega y actualizar dependencias antes del piloto real; no se declara esta base lista para producción.

## Siguientes incrementos

1. Configurar el proyecto Firebase de pruebas. Validar el flujo y el PDF con Alianza en web y Android.
2. Acordar firmas de co-responsables, revisión de solicitudes de privacidad y retención antes de incorporar datos reales.
3. Evaluar membresías en varias empresas, historial de cambios y distribución de escritorio.
4. Evaluar IA opcional después del piloto.
