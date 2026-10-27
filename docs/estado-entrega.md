# Estado verificable de la entrega

Fecha: 26 de octubre de 2026. Este registro describe la preparación local del primer commit; los resultados remotos se comprueban en Actions.

| Entregable | Estado |
|---|---|
| Auditoría preventiva | Terminada, 8 páginas y fuente Markdown |
| Especificación | Terminada, 5 páginas y fuente Markdown |
| Proyecto Expo | Formulario local, sin nube ni usuarios reales |
| ESLint | Pasó localmente |
| TypeScript | Pasó localmente |
| Exportación web | Pasó localmente, 197 módulos |
| Repositorio remoto | Creado por el usuario: https://github.com/marcvalle10/Alianza |
| Primer commit y develop | Preparados para publicación |
| GitHub Actions | Pendiente de comprobar tras push |
| Protección de main | Regla preparada; pendiente de guardar tras primer push |

Las comprobaciones locales usaron Node 24.19.0. CI está configurado con Node 22. El Node 20.19.0 instalado en el equipo no cumple el mínimo 20.19.4 de React Native 0.81.5; utilizar Node 22 LTS para seguir el README.

La resolución inicial se fijó a paquetes publicados antes del 1 de febrero de 2026 porque el registro devolvía dependencias no disponibles. `package-lock.json` permite repetir la instalación con `npm ci`, sin volver a usar esa fecha de corte.

La instalación reportó 154 alertas de dependencias: 76 bajas, 41 moderadas, 35 altas y 2 críticas. No equivalen a 154 fallos comprobados explotables en la app, pero bloquean considerar esta base apta para producción. Hay que analizar el árbol, actualizar dependencias compatibles y repetir la revisión antes de integrar datos reales. No se usó una corrección forzada que pudiera romper Expo.

No se han probado compilaciones Android/iOS, tráfico de red de producción, Firebase, firma electrónica, IA ni exportación exacta del ticket original.
