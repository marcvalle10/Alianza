# Expedientes de demostración

El catálogo de Alianza Servicios contiene 16 expedientes ficticios inspirados en las categorías de trabajo descritas en los reportes FPP-3, FPP-4 y el reporte técnico de prácticas profesionales. Los documentos originales contienen información de terceros y quedan fuera de este repositorio. Los clientes, fechas, costos y resultados del catálogo son ilustrativos.

El conjunto tiene cuatro tickets por estado. Cada registro usa un folio reservado `demo-alianza-01` a `demo-alianza-16`, un nombre de cliente precedido por `DEMO` y una descripción que comienza con `[DEMO]`.

| Folio | Servicio | Estado |
| --- | --- | --- |
| demo-alianza-01 | Cableado estructurado | Pendiente |
| demo-alianza-02 | Puntos de acceso inalámbrico | Pendiente |
| demo-alianza-03 | Sistema de audio | Pendiente |
| demo-alianza-04 | Sistema de videoconferencia | Pendiente |
| demo-alianza-05 | Fibra óptica y site | En proceso |
| demo-alianza-06 | Gabinete de comunicaciones | En proceso |
| demo-alianza-07 | Control de acceso | En proceso |
| demo-alianza-08 | NAS y respaldos | En proceso |
| demo-alianza-09 | Videoconferencia y audio | Concluido |
| demo-alianza-10 | Canalización y nodos de red | Concluido |
| demo-alianza-11 | Equipos portátiles | Concluido |
| demo-alianza-12 | Conectividad inalámbrica | Concluido |
| demo-alianza-13 | Sistema de videovigilancia | Requiere seguimiento |
| demo-alianza-14 | Sistema de detección de incendio | Requiere seguimiento |
| demo-alianza-15 | Enlace de telecomunicaciones | Requiere seguimiento |
| demo-alianza-16 | Terminal de registro de asistencia | Requiere seguimiento |

Los ejemplos incluyen prioridades, diagnóstico, actividades, resultados, observaciones, seguimiento y costos cuando aplican. Se crean con un responsable administrativo activo de la empresa de demostración y quedan sin técnico asignado para permitir la práctica de asignación. Las conformidades se registran únicamente mediante el flujo autorizado de la aplicación.

## Ejecución local

Desde la raíz del repositorio, iniciar los emuladores con `npm run emulators`. En otra terminal PowerShell:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
node scripts/seed-emulators.mjs
node scripts/seed-company-demo.mjs demo-alianza empresa-demo demo-admin --check
node scripts/seed-company-demo.mjs demo-alianza empresa-demo demo-admin --apply
node scripts/seed-company-demo.mjs demo-alianza empresa-demo demo-admin --check
```

En el piloto remoto, el operador autorizado ejecuta el mismo script con el proyecto `alianza-a1bc3`, la empresa `alianza-informatica` y el UID verificado del administrador designado. El script comprueba primero la empresa y membresía, y utiliza IDs fijos y escrituras de creación para evitar duplicar o sobrescribir tickets existentes. La ejecución con `--check` revisa el estado sin escribir datos.

La presentación se realiza con el entorno de pruebas y datos ficticios. Los accesos a la empresa siguen sujetos a las membresías y las reglas de Firestore y Storage existentes.
