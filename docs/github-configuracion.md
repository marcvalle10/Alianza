# Configuración remota de GitHub

Nombre propuesto: alianza-servicios. Visibilidad recomendada: privada, por tratarse de un proyecto empresarial. No incluir el PDF cumplimentado ni imágenes de clientes.

1. Crear un repositorio vacío en la cuenta propietaria autorizada.
2. Agregar el remoto y subir main y develop.
3. Esperar la ejecución de Actions > CI y comprobar el estado verde del commit de main.
4. En Settings > Rules > Rulesets, crear una regla para main: requerir pull request, resolver conversaciones, exigir el check quality, bloquear force push y eliminación. Exigir una aprobación cuando haya otro revisor. Comprobar disponibilidad de reglas para repositorios privados según el plan de GitHub.
5. Verificar con un cambio de prueba que la regla bloquea la integración mientras falla CI. No considerar protegida la rama solo por existir este documento.
6. Conservar enlaces al repositorio, ejecución de CI y regla aplicada como evidencia de entrega.

El workflow realiza integración continua. No despliega Firebase, tiendas ni Electron. El despliegue queda para una fase posterior con ambientes separados y aprobación de publicación.

