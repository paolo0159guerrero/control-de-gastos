const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function fechaValida(s) {
  if (typeof s !== 'string' || !FECHA.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

// Valida los datos de un gasto (HU-01 y HU-05).
function validarGasto(body = {}) {
  const errores = [];
  const descripcion = String(body.descripcion ?? '').trim();
  const monto = Number(body.monto);
  const fecha_vencimiento = String(body.fecha_vencimiento ?? '').trim();

  if (!descripcion) errores.push('La descripción es obligatoria.');
  if (body.monto === undefined || body.monto === '' || !Number.isFinite(monto) || monto <= 0)
    errores.push('El monto es obligatorio y debe ser mayor que cero.');
  if (!fecha_vencimiento) errores.push('La fecha de vencimiento es obligatoria.');
  else if (!fechaValida(fecha_vencimiento)) errores.push('La fecha de vencimiento no es válida (use AAAA-MM-DD).');

  return {
    errores,
    datos: {
      descripcion,
      proveedor: String(body.proveedor ?? '').trim(),
      categoria: String(body.categoria ?? '').trim(),
      monto: Math.round(monto * 100) / 100,
      fecha_vencimiento,
      observaciones: String(body.observaciones ?? '').trim(),
    },
  };
}

module.exports = { validarGasto, fechaValida };
