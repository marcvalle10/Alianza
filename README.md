# Alianza Servicios

Base académica de una aplicación de tickets para Alianza Informática. Clientes solicitan servicios y el personal gestiona diagnóstico, trabajo y seguimiento. El incremento 2 prepara acceso y tickets con Firebase; requiere configurar el proyecto. No es un sistema de producción.

## Estado actual

- Expo y TypeScript en `/app`.
- Esquema de campos del formato de servicio, con apartados 1 a 8 y 10.
- Registro, verificación de correo y recuperación de acceso con Firebase Authentication.
- Captura y consulta de tickets en Firestore con permisos por empresa, cliente y técnico asignado.
- Asignación por administrador y seguimiento de diagnóstico, trabajo y resultado.
- Demo del formato completo en `/demo`, temporal en memoria.
- Archivos, firmas reales, exportación fiel e IA pendientes.
- Auditoría preventiva y especificación en `/docs`.
- Workflow de CI y plantilla de pull request.

Consultar [estado de entrega](docs/estado-entrega.md) para las verificaciones y pendientes reales.

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

La salida web se genera en `app/dist`. El servidor de publicación deberá resolver rutas de Expo Router. La demo no conserva datos al recargar; los tickets conectados sí persisten en Firestore. La sesión de acceso solo se conserva en memoria.

## Configuración y secretos

Sin `.env`, la app muestra conexión pendiente y permite abrir la demo. Para conectar Firebase, copiar las variables públicas de `.env.example` a `app/.env`, habilitar Authentication y publicar `firestore.rules`. Seguir la [guía de Firebase](docs/firebase-setup.md), incluida la activación manual de roles. No se incluye una cuenta de servicio. Las claves de IA pertenecen exclusivamente al backend futuro.

Para probar permisos sin proyecto real, instalar Node 22 y Java 21 y ejecutar desde la raíz:

```sh
npm ci
npm run test:rules
```

Para iniciar el entorno local interactivo: `npm run emulators`. Configurar `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` en `app/.env`. Usa exclusivamente el proyecto ficticio `demo-alianza`.

## Arquitectura prevista

Expo para Android, iOS y web; Firebase Authentication para acceso por correo; Firestore para expedientes; Storage para imágenes y documentos; Cloud Functions con Node.js para operaciones privilegiadas e IA. Electron es una extensión posterior de escritorio. MCP no es necesario en esta fase.

La asistencia de IA permanece pendiente y desactivada. Requiere proveedor, región, contrato y consentimiento separados. Nunca enviar automáticamente el expediente completo.

## Formato y privacidad

El código toma la estructura de las cuatro páginas de referencia, sin copiar los datos reales. No incluye el PDF original, las fotografías ni firmas del cliente. La exportación con diseño exacto, la carga de evidencia y las firmas siguen pendientes. Los campos de firma y archivos de la demo solo aceptan referencias de texto.

No capturar datos reales en la demo. Los plazos de retención de `/docs` son propuestas que debe aprobar la empresa; aún no hay purgas ni proceso ARCO implementados.

## Git y CI

Ramas: `main` y `develop`. Convención: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`, etc. Ejemplo: `feat: add ticket status filters`.

CI valida commits, instala desde ambos lockfiles, ejecuta linter, TypeScript, exportación web y pruebas de reglas con Firestore Emulator. No hay despliegue automático. `main` se integra mediante PR y el check `quality`; ver [guía remota](docs/github-configuracion.md).

## Documentos

- [Especificación de fase 1](docs/especificacion-fase-1.md)
- [Auditoría de privacidad](docs/auditoria-privacidad.md)
- [Inventario estructurado](docs/inventario-datos.json)
- [Configuración de Firebase](docs/firebase-setup.md)
- [Incremento 2 y cambios de privacidad](docs/incremento-2.md)

Los PDF de entrega se generan localmente en `output/pdf` mediante `scripts/build_documents.py` con Python y ReportLab; esa carpeta está excluida de Git. Las fuentes Markdown sí se versionan.

## Decisiones de compatibilidad

La plantilla reciente falló por dependencias no publicadas en el registro disponible. Se seleccionó Expo SDK 54, ESLint 9.25.0 y typescript-eslint 8.46.1. La resolución inicial usó una fecha de corte del 1 de febrero de 2026; las instalaciones posteriores deben usar `npm ci` con el lockfile. Revisar las alertas de seguridad registradas en el estado de entrega y actualizar dependencias antes del piloto real; no se declara esta base lista para producción.

## Siguientes incrementos

1. Configurar el proyecto Firebase real y validar el flujo completo con cuentas ficticias.
2. Membresías en varias empresas, historial de cambios y resolución de edición concurrente.
3. Adjuntos y conformidad; exportación fiel del documento.
4. Retención, borrado y consentimiento de IA.
5. Piloto y evaluación de escritorio con Electron.
