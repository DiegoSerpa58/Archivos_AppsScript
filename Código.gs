const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Se ejecuta sola cada vez que se envía el formulario
function onFormSubmit(e) {
  procesarRegistro(e.values);
}

// Recibe un arreglo: [marcaTemporal, indicador, año, mes, numerador, denominador, observacion]
function procesarRegistro(v) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaRegistros = ss.getSheetByName('Registros');
  const hojaErrores = ss.getSheetByName('Errores');

  const indicador = String(v[1] || '').trim();
  const anioTxt   = String(v[2] || '').trim();
  const mes       = String(v[3] || '').trim();
  const numTxt    = String(v[4] || '').trim();
  const denTxt    = String(v[5] || '').trim();
  const obs       = String(v[6] || '').trim();
  const fecha     = new Date();

  const motivo = validar(indicador, anioTxt, mes, numTxt, denTxt);

  if (motivo) {
    hojaErrores.appendRow([fecha, indicador, anioTxt, mes, numTxt, denTxt, motivo]);
    return;
  }

  const anio = Number(anioTxt);
  const num = aNumero(numTxt);
  const den = aNumero(denTxt);
  const mesNum = MESES.indexOf(mes) + 1;
  const resultado = (num / den) * 100;

  hojaRegistros.appendRow([indicador, anio, mes, mesNum, num, den, resultado, obs, fecha, anio * 100 + mesNum]);
}

// Devuelve el motivo del error, o '' si todo está bien
function validar(indicador, anioTxt, mes, numTxt, denTxt) {
  if (!indicador || !anioTxt || !mes || !numTxt || !denTxt) {
    return 'Campos obligatorios vacíos.';
  }
  if (MESES.indexOf(mes) === -1) return 'Mes inválido.';

  const anio = Number(anioTxt);
  const num = aNumero(numTxt);
  const den = aNumero(denTxt);

  if (isNaN(anio) || isNaN(num) || isNaN(den)) return 'Valor numérico inválido.';
  if (num < 0) return 'El numerador no puede ser negativo.';
  if (den <= 0) return 'El denominador debe ser mayor que 0.';
  if (num > den) return 'El numerador no puede ser mayor que el denominador.';
  return '';
}

// Acepta "80,5" y "80.5"
function aNumero(texto) {
  return Number(String(texto).replace(',', '.'));
}

// Pruebas manuales (sin usar el formulario)
function pruebaManual() {
  procesarRegistro(['', 'Indicador A', '2026', 'Enero', '80', '100', 'válido']);
  procesarRegistro(['', 'Indicador A', '2026', 'Enero', '110', '100', 'num > den']);
  procesarRegistro(['', 'Indicador A', '2026', 'Enero', '50', '0', 'den = 0']);
  procesarRegistro(['', '', '2026', 'Enero', '50', '100', 'indicador vacío']);
}