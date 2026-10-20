// Reglas de negocio del PMV (seccion 4 del documento).
// Pagado: tiene fecha de pago. Vencido: no pagado y vencimiento < hoy. Pendiente: no pagado y vencimiento >= hoy.

function hoyISO(zona = process.env.ZONA_HORARIA || 'America/Lima', ahora = new Date()) {
  return ahora.toLocaleDateString('en-CA', { timeZone: zona }); // YYYY-MM-DD
}

function calcularEstado(gasto, hoy = hoyISO()) {
  if (gasto.fecha_pago) return 'Pagado';
  return gasto.fecha_vencimiento < hoy ? 'Vencido' : 'Pendiente';
}

function diasHasta(fechaISO, hoy = hoyISO()) {
  const a = Date.parse(hoy + 'T00:00:00Z');
  const b = Date.parse(fechaISO + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

function enriquecer(gasto, hoy = hoyISO(), diasAlerta = Number(process.env.DIAS_ALERTA) || 3) {
  const estado = calcularEstado(gasto, hoy);
  const dias = diasHasta(gasto.fecha_vencimiento, hoy);
  return { ...gasto, estado, dias_para_vencer: dias, proximo_a_vencer: estado === 'Pendiente' && dias <= diasAlerta };
}

module.exports = { hoyISO, calcularEstado, diasHasta, enriquecer };
