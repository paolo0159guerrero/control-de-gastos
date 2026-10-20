const test = require('node:test');
const assert = require('node:assert');
const { abrirDB } = require('../src/db');
const { crearApp } = require('../src/app');
const { calcularEstado } = require('../src/utils/estado');

test('calcularEstado aplica las reglas del PMV', () => {
  const hoy = '2026-10-15';
  assert.equal(calcularEstado({ fecha_vencimiento: '2026-10-15' }, hoy), 'Pendiente');
  assert.equal(calcularEstado({ fecha_vencimiento: '2026-10-14' }, hoy), 'Vencido');
  assert.equal(calcularEstado({ fecha_vencimiento: '2026-10-01', fecha_pago: '2026-10-02' }, hoy), 'Pagado');
});

test('flujo completo: registrar, listar, pagar, resumen', async () => {
  const server = crearApp(abrirDB(':memory:')).listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const json = (m, url, body) =>
    fetch(base + url, { method: m, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });

  try {
    let r = await json('POST', '/gastos', { descripcion: '', monto: 0, fecha_vencimiento: '' });
    assert.equal(r.status, 400);

    r = await json('POST', '/gastos', { descripcion: 'Luz', proveedor: 'Electro', monto: 120.5, fecha_vencimiento: '2020-01-10' });
    assert.equal(r.status, 201);
    const g = await r.json();
    assert.equal(g.estado, 'Vencido');

    r = await json('PATCH', `/gastos/${g.id}/pago`, {});
    assert.equal(r.status, 400); // exige fecha de pago

    r = await json('PATCH', `/gastos/${g.id}/pago`, { fecha_pago: '2020-01-09' });
    assert.equal((await r.json()).estado, 'Pagado');

    const lista = await (await fetch(`${base}/gastos?mes=2020-01`)).json();
    assert.equal(lista.cantidad, 1);
    const resumen = await (await fetch(`${base}/resumen?mes=2020-01`)).json();
    assert.equal(resumen.Pagado, 120.5);
    assert.equal(resumen.Vencido, 0);
  } finally {
    server.close();
  }
});
