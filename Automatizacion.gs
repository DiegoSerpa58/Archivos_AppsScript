const TOLERANCIA_MS = 30 * 1000; // margen de 30 segundos

// ===== Se ejecuta cada minuto por el activador =====
function tick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return; // ya hay otra ejecución en curso
  try {
    const p = leerParametros();
    if (!p.activo) return;

    if (!p.valido) {
      const msg = 'Parámetros inválidos: revise IntervaloEjecucion y Unidad.';
      const u = ultimaEjecucion();
      if (!u || u.mensaje !== msg) registrarLog('Error', msg, 0, '');
      return;
    }

    const ultima = ultimaEjecucion();
    if (ultima) {
      const transcurrido = new Date().getTime() - ultima.fecha.getTime();
      if (transcurrido < p.minutos * 60 * 1000 - TOLERANCIA_MS) return; // aún no toca
    }
    ejecutarProceso();
  } finally {
    lock.releaseLock();
  }
}

// ===== Leer la pestaña Parametros =====
function leerParametros() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Parametros');
  const fila = hoja.getRange(2, 1, 1, 3).getValues()[0];
  const valor = Number(fila[0]);
  const unidad = sinTildes(String(fila[1])).trim().toLowerCase();
  const activo = sinTildes(String(fila[2])).trim().toUpperCase();

  let minutos = NaN;
  if (unidad === 'minutos') minutos = valor;
  else if (unidad === 'horas') minutos = valor * 60;

  return { activo: activo === 'SI', minutos: minutos, valido: minutos > 0 };
}

function sinTildes(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== Última fila del Log_Ejecuciones =====
function ultimaEjecucion() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log_Ejecuciones');
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return null;
  const f = hoja.getRange(ultimaFila, 1, 1, 3).getValues()[0];
  return { fecha: new Date(f[0]), estado: f[1], mensaje: f[2] };
}

// ===== Crear / eliminar el activador de cada minuto =====
function crearActivadorTick() {
  eliminarActivadorTick(); // evita duplicados
  ScriptApp.newTrigger('tick').timeBased().everyMinutes(1).create();
}

function eliminarActivadorTick() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'tick')
    .forEach(t => ScriptApp.deleteTrigger(t));
}