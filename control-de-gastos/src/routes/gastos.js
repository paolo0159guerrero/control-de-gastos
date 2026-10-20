const express = require('express');
const { enriquecer, hoyISO } = require('../utils/estado');
const { validarGasto, fechaValida } = require('../utils/validar');

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function crearRouter(db) {
  const router = express.Router();

  const listar = (mes) =>
    db
      .prepare(`SELECT * FROM gastos WHERE substr(fecha_vencimiento,1,7) = ?`)
      .all(mes)
      .map((g) => enriquecer(g, hoyISO()));

  // Primero los no pagados por vencimiento mas cercano (los vencidos quedan arriba), luego los pagados.
  const ordenar = (a, b) => {
    const pa = a.estado === 'Pagado' ? 1 : 0;
    const pb = b.estado === 'Pagado' ? 1 : 0;
    return pa - pb || a.fecha_vencimiento.localeCompare(b.fecha_vencimiento) || a.id - b.id;
  };

  // HU-02, HU-03, HU-06: listado mensual con busqueda y filtro por estado
  router.get('/gastos', (req, res) => {
    const mes = req.query.mes || hoyISO().slice(0, 7);
    if (!MES.test(mes)) return res.status(400).json({ errores: ['El mes debe tener formato AAAA-MM.'] });
    const q = String(req.query.q || '').trim().toLowerCase();
    const estado = String(req.query.estado || '').trim();

    let gastos = listar(mes);
    if (q) gastos = gastos.filter((g) => `${g.descripcion} ${g.proveedor}`.toLowerCase().includes(q));
    if (estado) gastos = gastos.filter((g) => g.estado === estado);
    gastos.sort(ordenar);

    const total = gastos.reduce((s, g) => s + g.monto, 0);
    res.json({ mes, total: Math.round(total * 100) / 100, cantidad: gastos.length, gastos });
  });

  // HU-07: resumen por estado
  router.get('/resumen', (req, res) => {
    const mes = req.query.mes || hoyISO().slice(0, 7);
    if (!MES.test(mes)) return res.status(400).json({ errores: ['El mes debe tener formato AAAA-MM.'] });
    const r = { mes, total: 0, Pagado: 0, Pendiente: 0, Vencido: 0, cantidad: 0 };
    for (const g of listar(mes)) {
      r[g.estado] += g.monto;
      r.total += g.monto;
      r.cantidad += 1;
    }
    for (const k of ['total', 'Pagado', 'Pendiente', 'Vencido']) r[k] = Math.round(r[k] * 100) / 100;
    res.json(r);
  });

  // HU-01: registrar gasto
  router.post('/gastos', (req, res) => {
    const { errores, datos } = validarGasto(req.body);
    if (errores.length) return res.status(400).json({ errores });
    const info = db
      .prepare(
        `INSERT INTO gastos (descripcion, proveedor, categoria, monto, fecha_vencimiento, observaciones)
         VALUES (@descripcion, @proveedor, @categoria, @monto, @fecha_vencimiento, @observaciones)`
      )
      .run(datos);
    const gasto = db.prepare('SELECT * FROM gastos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(enriquecer(gasto));
  });

  // HU-05: corregir gasto (no cambia el estado de pago)
  router.put('/gastos/:id', (req, res) => {
    const existente = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id);
    if (!existente) return res.status(404).json({ errores: ['El gasto no existe.'] });
    const { errores, datos } = validarGasto(req.body);
    if (errores.length) return res.status(400).json({ errores });
    db.prepare(
      `UPDATE gastos SET descripcion=@descripcion, proveedor=@proveedor, categoria=@categoria,
       monto=@monto, fecha_vencimiento=@fecha_vencimiento, observaciones=@observaciones WHERE id=@id`
    ).run({ ...datos, id: existente.id });
    res.json(enriquecer(db.prepare('SELECT * FROM gastos WHERE id = ?').get(existente.id)));
  });

  // HU-04: registrar que el pago ya se hizo (fuera del sistema)
  router.patch('/gastos/:id/pago', (req, res) => {
    const existente = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id);
    if (!existente) return res.status(404).json({ errores: ['El gasto no existe.'] });
    if (existente.fecha_pago) return res.status(409).json({ errores: ['Este gasto ya figura como pagado.'] });
    const fecha = String(req.body?.fecha_pago ?? '').trim();
    if (!fecha) return res.status(400).json({ errores: ['Indique la fecha en que se realizó el pago.'] });
    if (!fechaValida(fecha)) return res.status(400).json({ errores: ['La fecha de pago no es válida (use AAAA-MM-DD).'] });
    db.prepare('UPDATE gastos SET fecha_pago = ? WHERE id = ?').run(fecha, existente.id);
    res.json(enriquecer(db.prepare('SELECT * FROM gastos WHERE id = ?').get(existente.id)));
  });

  return router;
}

module.exports = { crearRouter };
