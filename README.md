# Automatización de indicadores en Google Apps Script

Proyecto de Google Apps Script para recibir registros de indicadores desde un
Google Form, validarlos, calcular estadísticas y enviar periódicamente un
reporte Excel por correo electrónico.

## Funcionalidades

- Procesa automáticamente cada respuesta enviada al formulario.
- Valida campos obligatorios, meses, años y valores numéricos.
- Rechaza numeradores negativos, denominadores no positivos y porcentajes
  mayores al 100 %.
- Guarda los registros válidos y los errores en hojas separadas.
- Calcula por indicador, año y mes:
  - media mensual;
  - media acumulada;
  - mediana;
  - varianza poblacional.
- Genera un archivo `.xlsx` con las hojas `Datos` y `Resumen estadístico`.
- Guarda los reportes en una carpeta de Google Drive llamada `Reportes`.
- Envía el reporte por correo y registra cada ejecución.
- Permite configurar el intervalo de ejecución en la hoja `Parametros`.

## Estructura del proyecto

| Archivo | Responsabilidad |
| --- | --- |
| `Código.gs` | Recepción de respuestas, validación y almacenamiento de registros |
| `Calculos.gs` | Funciones estadísticas y lectura de registros |
| `Reporte.gs` | Generación del Excel, envío de correo y registro de resultados |
| `Automatizacion.gs` | Ejecución programada mediante un activador cada minuto |
| `DatosPrueba.gs` | Carga de datos válidos y casos erróneos para pruebas |

## Requisitos

- Una cuenta de Google con acceso a Google Sheets, Drive y Gmail.
- Un Google Sheet vinculado al proyecto de Apps Script.
- Un Google Form conectado al Sheet, si se desea usar el procesamiento
  automático de respuestas.
- Autorización para usar Spreadsheet, Drive, Mail y Url Fetch.

## Configuración del Google Sheet

El archivo debe contener las siguientes pestañas. La primera fila de cada
pestaña debe utilizar estos encabezados:

### `Registros`

| Indicador | Año | Mes | MesNum | Numerador | Denominador | Resultado | Observación | Fecha | Clave |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Los registros válidos se agregan automáticamente. `Resultado` se calcula como:

```text
(Numerador / Denominador) × 100
```

### `Errores`

| Fecha | Indicador | Año | Mes | Numerador | Denominador | Motivo |
| --- | --- | --- | --- | --- | --- | --- |

Las respuestas que no cumplen las reglas de validación se almacenan aquí y no
se agregan a `Registros`.

### `Parametros`

| IntervaloEjecucion | Unidad | Activo |
| --- | --- | --- |
| 5 | Minutos | SI |

`Unidad` acepta `Minutos` u `Horas`. Para desactivar la generación automática,
usa `NO` en `Activo`.

### `Log_Ejecuciones`

| Fecha | Estado | Mensaje | Procesados | Archivo |
| --- | --- | --- | --- | --- |

Esta pestaña conserva el resultado de cada intento de generación y envío.

## Configuración del formulario

La respuesta del formulario debe tener este orden:

1. Marca temporal
2. Indicador
3. Año
4. Mes
5. Numerador
6. Denominador
7. Observación

Los meses deben escribirse exactamente como aparecen en esta lista:

`Enero`, `Febrero`, `Marzo`, `Abril`, `Mayo`, `Junio`, `Julio`, `Agosto`,
`Septiembre`, `Octubre`, `Noviembre`, `Diciembre`.

## Instalación

1. Abre el Google Sheet que funcionará como fuente de datos.
2. Ve a **Extensiones → Apps Script**.
3. Copia los archivos `.gs` de este repositorio al proyecto.
4. Crea las pestañas requeridas y sus encabezados.
5. En `Reporte.gs`, configura `DESTINATARIOS`.
   - Déjalo vacío para enviar al correo del usuario efectivo del script.
   - Para varios destinatarios, sepáralos por comas.
6. Guarda el proyecto y ejecuta una función por primera vez para conceder
   permisos.
7. Configura los activadores:
   - `onFormSubmit`: activador **Desde hoja de cálculo → Al enviar formulario**.
   - `tick`: activador basado en tiempo **cada minuto**.

También puedes crear el activador de `tick` desde el editor ejecutando
`crearActivadorTick()`. Esta función elimina activadores duplicados antes de
crear uno nuevo.

## Flujo de ejecución

```text
Formulario
   ↓
onFormSubmit
   ↓
Validación
   ├─ inválido → Errores
   └─ válido   → Registros
                    ↓
                 tick
                    ↓
             ejecutarProceso
                    ↓
       Resumen estadístico + Excel
                    ↓
             Drive + correo
                    ↓
             Log_Ejecuciones
```

El activador `tick` se ejecuta cada minuto, pero solo genera un reporte cuando
ha transcurrido el intervalo configurado en `Parametros`. Un bloqueo de script
evita que dos ejecuciones procesen información simultáneamente.

## Pruebas manuales

Las funciones de prueba se pueden ejecutar desde el editor de Apps Script:

- `pruebaManual()`: prueba registros válidos y errores de validación.
- `pruebaCalculos()`: prueba las funciones estadísticas con datos en memoria.
- `pruebaConHoja()`: calcula y muestra el resumen usando la pestaña
  `Registros`.
- `cargarDatosPrueba()`: limpia `Registros` y `Errores` y carga datos de
  ejemplo.

Recomendación: ejecuta `cargarDatosPrueba()` únicamente en una hoja de pruebas,
porque elimina el contenido existente debajo de los encabezados de
`Registros` y `Errores`.

## Reporte generado

Cada archivo se guarda en Drive con el formato:

```text
Indicadores_AAAA_MM_DD_HHmm.xlsx
```

El Excel contiene:

- `Datos`: registros ordenados por indicador, año y mes.
- `Resumen estadístico`: resultados mensuales y acumulados con dos decimales.

Si la generación del archivo falla, el correo no se envía y el error queda
registrado en `Log_Ejecuciones`.

## Consideraciones

- El proyecto usa la zona horaria configurada en Apps Script para nombrar los
  reportes.
- `DESTINATARIOS` y el contenido del correo se configuran en `Reporte.gs`.
- La carpeta `Reportes` se crea automáticamente si no existe.
- Los libros temporales usados para exportar el Excel se eliminan después de
  cada ejecución.
- El cálculo de la media acumulada incluye todos los registros del mismo
  indicador y año desde enero hasta el mes evaluado.
