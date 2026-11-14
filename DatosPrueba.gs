function cargarDatosPrueba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Limpiar Registros y Errores (deja los encabezados)
  ['Registros', 'Errores'].forEach(nombre => {
    const hoja = ss.getSheetByName(nombre);
    const filas = hoja.getLastRow() - 1;
    if (filas > 0) hoja.getRange(2, 1, filas, hoja.getLastColumn()).clearContent();
  });

  const A = 'Indicador A', B = 'Indicador B';

  // 2. Registros válidos: [indicador, año, mes, numerador, denominador]
  const validos = [
    [A, 2026, 'Enero', 80, 100], [A, 2026, 'Enero', 90, 100], [A, 2026, 'Enero', 70, 100],
    [A, 2026, 'Febrero', 85, 100], [A, 2026, 'Febrero', 95, 100],
    [A, 2026, 'Marzo', 60, 100], [A, 2026, 'Marzo', 70, 100],
    [A, 2026, 'Marzo', 80, 100], [A, 2026, 'Marzo', 90, 100],
    [A, 2025, 'Noviembre', 70, 100], [A, 2025, 'Noviembre', 90, 100],
    [A, 2025, 'Diciembre', 100, 100], [A, 2025, 'Diciembre', 80, 100], [A, 2025, 'Diciembre', 90, 100],
    [B, 2026, 'Enero', 50, 100], [B, 2026, 'Enero', 100, 100],
    [B, 2026, 'Febrero', 45, 50], [B, 2026, 'Febrero', 40, 50], [B, 2026, 'Febrero', 35, 50],
    [B, 2026, 'Marzo', 20, 40], [B, 2026, 'Marzo', 30, 40], [B, 2026, 'Marzo', 40, 40],
    [B, 2025, 'Diciembre', 60, 100], [B, 2025, 'Diciembre', 80, 100]
  ];
  validos.forEach(r => procesarRegistro(
    ['', r[0], String(r[1]), r[2], String(r[3]), String(r[4]), 'Dato de prueba']));

  // 3. Casos erróneos: [indicador, año, mes, numerador, denominador]
  const erroneos = [
    [A, '2026', 'Enero', '110', '100'],   // numerador > denominador
    [B, '2026', 'Febrero', '50', '0'],    // denominador = 0
    ['', '2026', 'Marzo', '50', '100'],   // indicador vacío
    [A, '2026', 'Marzo', '', '100']       // numerador vacío
  ];
  erroneos.forEach(r => procesarRegistro(
    ['', r[0], r[1], r[2], r[3], r[4], 'Caso erróneo']));

  Logger.log('Cargados ' + validos.length + ' registros válidos y ' + erroneos.length + ' casos erróneos.');
}