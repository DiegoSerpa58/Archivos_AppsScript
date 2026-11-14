// ===== Configuración =====
const DESTINATARIOS = ''; // Correos separados por coma. Vacío = tu propio correo
const ASUNTO = 'Reporte automático de indicadores';
const CUERPO = 'Buen día,\n\n' +
  'Se adjunta el reporte actualizado de indicadores, incluyendo los cálculos estadísticos correspondientes. ' +
  'El archivo contiene los registros procesados y el resumen de media mensual, media acumulada anual, mediana y varianza.\n\n' +
  'Saludos.';
const NOMBRE_CARPETA = 'Reportes';

// ===== Proceso principal =====
function ejecutarProceso() {
  let nombreArchivo = '';
  let procesados = 0;
  try {
    const registros = leerRegistros();
    procesados = registros.length;
    if (procesados === 0) throw new Error('No hay registros válidos para procesar.');

    const resumen = calcularResumen(registros);
    const archivo = generarExcel(registros, resumen); // si falla, lanza error y NO se envía correo
    nombreArchivo = archivo.getName();

    enviarCorreo(archivo);
    registrarLog('Exitoso', 'Excel generado y enviado por correo.', procesados, nombreArchivo);
  } catch (err) {
    registrarLog('Error', err.message, procesados, nombreArchivo);
  }
}

// ===== Generar el Excel =====
function generarExcel(registros, resumen) {
  const temp = SpreadsheetApp.create('temp_reporte_indicadores');
  const idTemp = temp.getId();
  try {
    // Hoja "Datos"
    const hojaDatos = temp.getSheets()[0];
    hojaDatos.setName('Datos');
    const ordenados = registros.slice().sort((a, b) =>
      a.indicador.localeCompare(b.indicador) || a.anio - b.anio || a.mesNum - b.mesNum);
    const filasDatos = ordenados.map(r =>
      [r.indicador, r.anio, r.mes, r.numerador, r.denominador, redondear2(r.resultado)]);
    hojaDatos.getRange(1, 1, 1, 6)
      .setValues([['Indicador', 'Año', 'Mes', 'Numerador', 'Denominador', 'Resultado']])
      .setFontWeight('bold');
    hojaDatos.getRange(2, 1, filasDatos.length, 6).setValues(filasDatos);
    hojaDatos.getRange(2, 6, filasDatos.length, 1).setNumberFormat('0.00"%"');
    hojaDatos.autoResizeColumns(1, 6);

    // Hoja "Resumen estadístico"
    const hojaResumen = temp.insertSheet('Resumen estadístico');
    const filasResumen = resumen.map(r => [
      r.indicador, r.anio, r.mes,
      redondear2(r.mediaMes), redondear2(r.mediaAcumulada),
      redondear2(r.mediana), redondear2(r.varianza)
    ]);
    hojaResumen.getRange(1, 1, 1, 7)
      .setValues([['Indicador', 'Año', 'Mes', 'Media mes', 'Media acumulada', 'Mediana', 'Varianza']])
      .setFontWeight('bold');
    hojaResumen.getRange(2, 1, filasResumen.length, 7).setValues(filasResumen);
    hojaResumen.getRange(2, 4, filasResumen.length, 3).setNumberFormat('0.00"%"');
    hojaResumen.getRange(2, 7, filasResumen.length, 1).setNumberFormat('0.00');
    hojaResumen.autoResizeColumns(1, 7);
    SpreadsheetApp.flush();

    // Confirmación 1: las hojas tienen todas las filas esperadas
    if (hojaDatos.getLastRow() - 1 !== registros.length ||
        hojaResumen.getLastRow() - 1 !== resumen.length) {
      throw new Error('El Excel no coincide con los registros procesados.');
    }

    // Exportar como .xlsx
    const respuesta = UrlFetchApp.fetch(
      'https://docs.google.com/spreadsheets/d/' + idTemp + '/export?format=xlsx',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true }
    );
    if (respuesta.getResponseCode() !== 200) {
      throw new Error('No se pudo exportar el Excel (HTTP ' + respuesta.getResponseCode() + ').');
    }

    // Guardar en Drive con el nombre Indicadores_AAAA_MM_DD_HHmm.xlsx
    const nombre = 'Indicadores_' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy_MM_dd_HHmm') + '.xlsx';
    const archivo = obtenerCarpetaReportes().createFile(respuesta.getBlob().setName(nombre));

    // Confirmación 2: el archivo existe y no está vacío
    if (archivo.getSize() === 0) throw new Error('El archivo Excel quedó vacío.');
    return archivo;
  } finally {
    DriveApp.getFileById(idTemp).setTrashed(true); // borra el libro temporal
  }
}

function obtenerCarpetaReportes() {
  const carpetas = DriveApp.getFoldersByName(NOMBRE_CARPETA);
  return carpetas.hasNext() ? carpetas.next() : DriveApp.createFolder(NOMBRE_CARPETA);
}

// ===== Enviar el correo =====
function enviarCorreo(archivo) {
  const destino = DESTINATARIOS || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({
    to: destino,
    subject: ASUNTO,
    body: CUERPO,
    attachments: [archivo.getBlob()]
  });
}

// ===== Registrar en Log_Ejecuciones =====
function registrarLog(estado, mensaje, procesados, archivo) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log_Ejecuciones');
  hoja.appendRow([new Date(), estado, mensaje, procesados, archivo || '']);
}