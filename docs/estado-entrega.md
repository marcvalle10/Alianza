# Estado verificable de la entrega

Fecha: 26 de octubre de 2026. Se verificaron las comprobaciones locales y las ejecuciones remotas del commit a7a85da46f99060fc12b1fe751b491145af41697.

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
| GitHub Actions | Pasó en main y develop: commits, npm ci, linter, tipos y exportación |
| Protección de main | Activa, con PR obligatorio, check quality, rama actualizada, conversaciones resueltas, bloqueo de borrados y force push |

## Evidencia remota

- [CI de main correcto](https://github.com/marcvalle10/Alianza/actions/runs/40455409429).
- [CI de develop correcto](https://github.com/marcvalle10/Alianza/actions/runs/40455408609).
- [Regla activa de main](https://github.com/marcvalle10/Alianza/settings/rules/25935302).
- main es la rama predeterminada. No hay usuarios de excepción en la regla. Se requieren cero aprobaciones externas porque todavía no se configuró otro revisor; el PR y CI sí son obligatorios. El origen del check figura como Any source, pues GitHub Actions no apareció en el selector; revisar este ajuste cuando esté disponible.

La protección se verificó por su configuración guardada. No se hizo una prueba destructiva de borrado o force push. La documentación final se integra mediante PR para usar el flujo protegido.

Las comprobaciones locales usaron Node 24.19.0. CI está configurado con Node 22. El Node 20.19.0 instalado en el equipo no cumple el mínimo 20.19.4 de React Native 0.81.5; utilizar Node 22 LTS para seguir el README.

La resolución inicial se fijó a paquetes publicados antes del 1 de febrero de 2026 porque el registro devolvía dependencias no disponibles. `package-lock.json` permite repetir la instalación con `npm ci`, sin volver a usar esa fecha de corte.

La consulta final de `npm audit` reportó 34 dependencias afectadas: 3 bajas, 14 moderadas, 16 altas y 1 crítica. Se actualizaron shell-quote a 1.12.0 y tar a 7.5.11 dentro de los rangos compatibles resueltos por el registro. La alerta crítica restante afecta a tar. Estos recuentos no equivalen a fallos explotables comprobados en la app, pero requieren revisión antes de producción. No se usó una corrección forzada que pudiera romper Expo. La base debe usarse únicamente con datos ficticios hasta resolver o mitigar los hallazgos y documentar su alcance.

No se han probado compilaciones Android/iOS, tráfico de red de producción, Firebase, firma electrónica, IA ni exportación exacta del ticket original.
