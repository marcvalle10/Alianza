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
| Primer commit y develop | Publicados; primer commit 167549643ff2eec35e3ebeb06138f7b376f35aa9 |
| GitHub Actions | Pendiente de comprobar tras push |
| Protección de main | Regla preparada; pendiente de guardar tras primer push |

Las comprobaciones locales usaron Node 24.19.0. CI está configurado con Node 22. El Node 20.19.0 instalado en el equipo no cumple el mínimo 20.19.4 de React Native 0.81.5; utilizar Node 22 LTS para seguir el README.

La resolución inicial se fijó a paquetes publicados antes del 1 de febrero de 2026 porque el registro devolvía dependencias no disponibles. `package-lock.json` permite repetir la instalación con `npm ci`, sin volver a usar esa fecha de corte.

La consulta final de `npm audit` reportó 34 dependencias afectadas: 3 bajas, 14 moderadas, 16 altas y 1 crítica. Se actualizaron shell-quote a 1.12.0 y tar a 7.5.11 dentro de los rangos compatibles resueltos por el registro. La alerta crítica restante afecta a tar. Estos recuentos no equivalen a fallos explotables comprobados en la app, pero requieren revisión antes de producción. No se usó una corrección forzada que pudiera romper Expo. La base debe usarse únicamente con datos ficticios hasta resolver o mitigar los hallazgos y documentar su alcance.

No se han probado compilaciones Android/iOS, tráfico de red de producción, Firebase, firma electrónica, IA ni exportación exacta del ticket original.
