# Alianza Servicios

Base académica de una aplicación de tickets para Alianza Informática. Clientes solicitan servicios y el personal administrará diagnóstico, trabajo, evidencia y cierre. La fase 1 contiene un formulario local; no es un sistema de producción.

## Estado actual

- Expo y TypeScript en `/app`.
- Esquema de campos del formato de servicio, con apartados 1 a 8 y 10.
- Captura temporal en memoria; sin autenticación, Firebase, archivos, firmas reales ni IA.
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

La salida web se genera en `app/dist`. Para servirla localmente se puede usar un servidor estático. El formulario no conserva los datos al cerrar o recargar.

## Configuración y secretos

La demo funciona sin `.env`. `.env.example` describe variables previstas para una integración posterior. Al integrar Firebase, copiar solo las variables públicas necesarias a `app/.env`; mantener credenciales de IA exclusivamente en el backend. Las reglas de seguridad son obligatorias: una clave pública de Firebase no protege la base de datos. No se incluye una cuenta de servicio.

## Arquitectura prevista

Expo para Android, iOS y web; Firebase Authentication para acceso por correo; Firestore para expedientes; Storage para imágenes y documentos; Cloud Functions con Node.js para operaciones privilegiadas e IA. Electron es una extensión posterior de escritorio. MCP no es necesario en esta fase.

La asistencia de IA permanece pendiente y desactivada. Requiere proveedor, región, contrato y consentimiento separados. Nunca enviar automáticamente el expediente completo.

## Formato y privacidad

El código toma la estructura de las cuatro páginas de referencia, sin copiar los datos reales. No incluye el PDF original, las fotografías ni firmas del cliente. La exportación con diseño exacto, la carga de evidencia y las firmas siguen pendientes. Los campos de firma y archivos de la demo solo aceptan referencias de texto.

No capturar datos reales en la demo. Los plazos de retención de `/docs` son propuestas que debe aprobar la empresa; aún no hay purgas ni proceso ARCO implementados.

## Git y CI

Ramas: `main` y `develop`. Convención: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`, etc. Ejemplo: `feat: add ticket status filters`.

CI valida los commits nuevos, instala desde el lockfile, ejecuta linter, TypeScript y exportación web. No hay despliegue automático. La protección de main debe aplicarse en GitHub; ver [guía remota](docs/github-configuracion.md).

## Documentos

- [Especificación de fase 1](docs/especificacion-fase-1.md)
- [Auditoría de privacidad](docs/auditoria-privacidad.md)
- [Inventario estructurado](docs/inventario-datos.json)

Los PDF de entrega se generan localmente en `output/pdf` mediante `scripts/build_documents.py` con Python y ReportLab; esa carpeta está excluida de Git. Las fuentes Markdown sí se versionan.

## Decisiones de compatibilidad

La plantilla reciente falló por dependencias no publicadas en el registro disponible. Se seleccionó Expo SDK 54, ESLint 9.25.0 y typescript-eslint 8.46.1. La resolución inicial usó una fecha de corte del 1 de febrero de 2026; las instalaciones posteriores deben usar `npm ci` con el lockfile. Revisar las alertas de seguridad registradas en el estado de entrega y actualizar dependencias antes del piloto real; no se declara esta base lista para producción.

## Siguientes incrementos

1. Firebase y aislamiento entre empresas con pruebas de reglas.
2. Asignación, seguimiento y validación de campos por etapa.
3. Adjuntos y conformidad; exportación fiel del documento.
4. Retención, borrado y consentimiento de IA.
5. Piloto y evaluación de escritorio con Electron.
