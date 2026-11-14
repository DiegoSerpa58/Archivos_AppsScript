// ===== Funciones matemáticas básicas =====
function media(valores) {
  const suma = valores.reduce((acc, x) => acc + x, 0);
  return suma / valores.length;
}

function mediana(valores) {
  const orden = valores.slice().sort((a, b) => a - b);
  const mitad = Math.floor(orden.length / 2);
  if (orden.length % 2 === 0) {
    return (orden[mitad - 1] + orden[mitad]) / 2;
  }
  return orden[mitad];
}

// Varianza poblacional: promedio de (valor - media)^2
function varianzaPoblacional(valores) {
  const mu = media(valores);
  const sumaCuadrados = valores.reduce((acc, x) => acc + Math.pow(x - mu, 2), 0);
  return sumaCuadrados / valores.length;
}

function redondear2(x) {
  return Math.round(x * 100) / 100;
}

// ===== Leer la pestaña Registros =====
function leerRegistros() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registros');
  const datos = hoja.getDataRange().getValues();
  datos.shift(); // quita la fila de encabezados
  return datos
    .filter(f => f[0] !== '')
    .map(f => ({
      indicador: f[0],
      anio: f[1],
      mes: f[2],
      mesNum: f[3],
      numerador: f[4],
      denominador: f[5],
      resultado: f[6],
      observacion: f[7],
      fecha: f[8]
    }));
}

// ===== Cálculo del resumen por indicador + año + mes =====
function calcularResumen(registros) {
  // 1. Agrupar
  const grupos = {};
  registros.forEach(r => {
    const clave = r.indicador + '|' + r.anio + '|' + r.mesNum;
    if (!grupos[clave]) {
      grupos[clave] = { indicador: r.indicador, anio: r.anio, mes: r.mes, mesNum: r.mesNum, valores: [] };
    }
    grupos[clave].valores.push(r.resultado);
  });

  // 2. Calcular estadísticas de cada grupo
  const resumen = Object.values(grupos).map(g => {
    // Todos los registros del mismo indicador y año, desde enero hasta este mes
    const acumulados = registros
      .filter(r => r.indicador === g.indicador && r.anio === g.anio && r.mesNum <= g.mesNum)
      .map(r => r.resultado);

    return {
      indicador: g.indicador,
      anio: g.anio,
      mes: g.mes,
      mesNum: g.mesNum,
      mediaMes: media(g.valores),
      mediaAcumulada: media(acumulados),
      mediana: mediana(g.valores),
      varianza: varianzaPoblacional(g.valores)
    };
  });

  // 3. Ordenar por indicador, año y mes
  resumen.sort((a, b) =>
    a.indicador.localeCompare(b.indicador) || a.anio - b.anio || a.mesNum - b.mesNum
  );
  return resumen;
}

// ===== Pruebas =====
function mostrarResumen(resumen) {
  resumen.forEach(r => {
    Logger.log(r.indicador + ' ' + r.anio + ' ' + r.mes +
      ' | media mes: ' + redondear2(r.mediaMes) +
      ' | acumulada: ' + redondear2(r.mediaAcumulada) +
      ' | mediana: ' + redondear2(r.mediana) +
      ' | varianza: ' + redondear2(r.varianza));
  });
}

// Prueba con datos en memoria (no toca el Sheet)
function pruebaCalculos() {
  const A = 'Indicador A', B = 'Indicador B';
  const datos = [
    { indicador: A, anio: 2026, mes: 'Enero',   mesNum: 1, resultado: 80 },
    { indicador: A, anio: 2026, mes: 'Enero',   mesNum: 1, resultado: 90 },
    { indicador: A, anio: 2026, mes: 'Enero',   mesNum: 1, resultado: 70 },
    { indicador: A, anio: 2026, mes: 'Febrero', mesNum: 2, resultado: 85 },
    { indicador: B, anio: 2026, mes: 'Enero',   mesNum: 1, resultado: 100 },
    { indicador: B, anio: 2026, mes: 'Enero',   mesNum: 1, resultado: 50 }
  ];
  mostrarResumen(calcularResumen(datos));
  Logger.log('Mediana impar [60,70,80,85,90]: ' + mediana([60, 70, 80, 85, 90]) + ' (esperado 80)');
  Logger.log('Mediana par [10,20,30,40]: ' + mediana([10, 20, 30, 40]) + ' (esperado 25)');
}

// Prueba con los datos reales del Sheet
function pruebaConHoja() {
  mostrarResumen(calcularResumen(leerRegistros()));
}