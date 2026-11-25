# Privacidad y operación de Alianza Servicios

El sitio y la APK de revisión se destinan a pruebas con datos ficticios. Antes de habilitar clientes, Alianza debe confirmar los mercados, su papel en el tratamiento y el de cada cliente empresarial, aprobar y publicar el aviso, y designar al titular y suplente del canal de privacidad. La política propuesta parte de una operación en México. [Texto vigente de la LFPDPPP](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf)

## Aviso de privacidad

Alianza debe completar su razón social, domicilio y canal de privacidad. El aviso debe describir los datos de acceso, perfiles, membresías, solicitudes, expedientes, evidencias, conformidades y exportaciones. Debe explicar el uso operativo de cada grupo, los destinatarios y sus permisos, el uso de Firebase, los flujos de tratamiento fuera de México cuando correspondan, el trámite de derechos ARCO y cómo se comunican cambios al aviso. Revisar la relación contractual con Google y confirmar la localización aplicable a Authentication y al soporte. Firestore y el bucket de pruebas están configurados en `us-central1`, Estados Unidos.

En el piloto se muestra un aviso antes de enviar credenciales y se pide confirmación del envío del reporte o archivo. El aviso definitivo debe definir cómo se informará del tratamiento en cada flujo y cuándo hará falta una autorización adicional. La conformidad del servicio confirma la recepción del trabajo.

## Plazos propuestos para aprobación

| Datos | Plazo propuesto | Acción al vencer |
| --- | --- | --- |
| Cuentas, expedientes, adjuntos y solicitudes ficticias | 30 días después del cierre del piloto | Retirar cuentas y eliminar registros y objetos de prueba mediante un procedimiento administrativo. |
| Cuenta, sesiones y membresías reales | Durante el acceso autorizado. Suspender el acceso al tramitar una baja y revisar en 30 días la supresión de los datos de perfil prescindibles. | Revocar sesiones, desactivar la cuenta y conservar solo los vínculos mínimos que el expediente deba mantener. |
| Expedientes, conformidades y cotizaciones | 24 meses desde el cierre del servicio | Suprimir o anonimizar si se puede preservar el trámite. Documentar las excepciones contractuales o legales y su fecha de revisión. |
| Fotografías de antes y después | 12 meses desde el cierre | Retirar de Storage y del expediente las referencias de acceso. Mantenerlas solo mientras sean necesarias para una garantía, reclamación u obligación aplicable. |
| Folio y resolución de solicitudes de privacidad y bajas | 12 meses desde la resolución, sujeto a aprobación administrativa | Conservar evidencia mínima de la atención y quitar documentos de verificación en cuanto se compruebe la identidad. |
| Copias de respaldo y objetos con borrado recuperable | Según la configuración del entorno. Registrar el plazo efectivo. | Controlar acceso hasta la expiración y reaplicar las bajas al restaurar. [Borrado recuperable en Cloud Storage](https://cloud.google.com/storage/docs/soft-delete) |

Los plazos son propuestas y requieren validación por Alianza. La app registra folios. La eliminación es administrativa y todavía requiere un calendario de revisión y un responsable operativo.

## Atención de solicitudes y bajas

1. El responsable de privacidad recibe el folio, registra la fecha, verifica la identidad por un canal aprobado y confirma el alcance. Su suplente cubre ausencias.
2. El operador de Firebase inventaría Authentication, las membresías en ambas rutas, tickets, conformidades, objetos y copias disponibles. Suspende el acceso pertinente y revoca sesiones cuando corresponda.
3. El responsable autoriza qué puede eliminarse, bloquearse o anonimizarse. El operador ejecuta la acción en cada sistema y confirma el resultado. Si el usuario exportó un PDF, la copia queda bajo el control de quien la guarda y debe incluirse en el procedimiento de la empresa.
4. El responsable conserva el folio y la evidencia mínima de la resolución y comunica la decisión. Alianza debe documentar los plazos legales aplicables y el medio de atención antes de abrir el servicio.

## Validaciones antes de usar datos reales

- Probar lectura y carga autenticadas para usuarios de diferentes empresas, con y sin asignación, después de suspender un acceso y desde Android. La aplicación descarga por el SDK y comprueba las reglas. Verificar que en producción los objetos no conserven vínculos de descarga de larga duración que puedan compartirse fuera del control de sesiones. [Descargas con el SDK y reglas de Storage](https://firebase.google.com/docs/storage/web/download-files)
- Limitar adjuntos al contenido necesario y revisar metadatos como EXIF. Confirmar qué campos opcionales pueden omitirse, en especial RFC, teléfono, domicilio y datos de los co-responsables.
- Revisar dependencias de aplicación y herramientas de compilación. Cerrar o justificar hallazgos críticos y altos con una revisión de alcance, actualizar a versiones compatibles y volver a ejecutar CI. Mantener el piloto con datos ficticios mientras se atienden.
- Probar la baja completa de una cuenta ficticia y documentar los plazos efectivos de respaldos. Definir responsables de accesos, privacidad, seguridad y monitoreo de cuotas.
- Actualizar las declaraciones de la tienda si se publica allí. El piloto se distribuye por web y APK interna. Los adjuntos, la exportación y las membresías deben quedar descritos en las declaraciones que correspondan.
