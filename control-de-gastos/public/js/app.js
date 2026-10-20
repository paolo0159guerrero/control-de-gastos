const $ = (s) => document.querySelector(s);
const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtFecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

let gastos = [];

async function api(url, opciones = {}) {
  const r = await fetch('/api' + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
    body: opciones.body && JSON.stringify(opciones.body),
  });
  const datos = await r.json();
  if (!r.ok) throw new Error((datos.errores || ['Error inesperado.']).join(' '));
  return datos;
}

function avisar(texto) {
  const a = $('#aviso');
  a.textContent = texto; a.hidden = false;
  setTimeout(() => (a.hidden = true), 4000);
}

function textoDias(g) {
  if (g.estado === 'Pagado') return 'Pagado el ' + fmtFecha(g.fecha_pago);
  const d = g.dias_para_vencer;
  if (d < 0) return `Venció hace ${-d} día${d === -1 ? '' : 's'}`;
  if (d === 0) return 'Vence hoy';
  return `Vence en ${d} día${d === 1 ? '' : 's'}`;
}

async function cargar() {
  const mes = $('#mes').value;
  const p = new URLSearchParams({ mes, q: $('#busqueda').value, estado: $('#filtro-estado').value });
  const [lista, resumen] = await Promise.all([api('/gastos?' + p), api('/resumen?mes=' + mes)]);
  gastos = lista.gastos;
  pintarResumen(resumen);
  pintarFilas(lista);
}

function pintarResumen(r) {
  const celda = (clase, titulo, valor) => `<div class="${clase}"><small>${titulo}</small><strong>${soles.format(valor)}</strong></div>`;
  $('#resumen').innerHTML =
    celda('r-total', 'Total del mes', r.total) + celda('r-Pagado', 'Pagado', r.Pagado) +
    celda('r-Pendiente', 'Pendiente', r.Pendiente) + celda('r-Vencido', 'Vencido', r.Vencido);
}

function pintarFilas(lista) {
  const filtrando = $('#busqueda').value || $('#filtro-estado').value;
  const vacio = $('#vacio');
  vacio.hidden = lista.cantidad > 0;
  vacio.textContent = filtrando ? 'No se encontraron gastos con esos filtros.' : 'No hay gastos registrados en este mes.';
  $('#filas').innerHTML = lista.gastos.map((g) => `
    <tr class="${g.estado === 'Vencido' ? 'vencido' : g.proximo_a_vencer ? 'proximo' : ''}">
      <td>${esc(g.descripcion)}${g.observaciones ? `<span class="sub">${esc(g.observaciones)}</span>` : ''}</td>
      <td>${esc(g.proveedor) || '—'}</td>
      <td>${esc(g.categoria) || '—'}</td>
      <td class="num">${soles.format(g.monto)}</td>
      <td>${fmtFecha(g.fecha_vencimiento)}<span class="sub">${textoDias(g)}</span></td>
      <td><span class="chip ${g.estado}">${g.estado}</span></td>
      <td class="solo-asistente">
        ${g.estado !== 'Pagado' ? `<button class="link" data-pagar="${g.id}">Registrar pago</button>` : ''}
        <button class="link" data-editar="${g.id}">Corregir</button>
      </td>
    </tr>`).join('');
}

// ---------- Formulario de gasto (HU-01 / HU-05) ----------
function abrirGasto(g) {
  const f = $('#form-gasto');
  f.reset();
  $('#error-gasto').hidden = true;
  $('#dlg-gasto-titulo').textContent = g ? 'Corregir gasto' : 'Registrar gasto';
  f.id.value = g?.id ?? '';
  for (const c of ['descripcion', 'proveedor', 'categoria', 'monto', 'fecha_vencimiento', 'observaciones']) f[c].value = g?.[c] ?? '';
  $('#dlg-gasto').showModal();
}

$('#form-gasto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const body = Object.fromEntries(new FormData(f));
  const id = body.id; delete body.id;
  try {
    await api(id ? `/gastos/${id}` : '/gastos', { method: id ? 'PUT' : 'POST', body });
    $('#dlg-gasto').close();
    if (body.fecha_vencimiento) $('#mes').value = body.fecha_vencimiento.slice(0, 7);
    await cargar();
    avisar(id ? 'Cambios guardados.' : 'Gasto registrado.');
  } catch (err) {
    $('#error-gasto').textContent = err.message; $('#error-gasto').hidden = false;
  }
});

// ---------- Registrar pago (HU-04) ----------
function abrirPago(g) {
  const f = $('#form-pago');
  f.reset(); $('#error-pago').hidden = true;
  f.id.value = g.id; f.fecha_pago.value = hoy();
  $('#pago-detalle').textContent = `${g.descripcion} — ${soles.format(g.monto)} (vence ${fmtFecha(g.fecha_vencimiento)})`;
  $('#dlg-pago').showModal();
}

$('#form-pago').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    await api(`/gastos/${f.id.value}/pago`, { method: 'PATCH', body: { fecha_pago: f.fecha_pago.value } });
    $('#dlg-pago').close();
    await cargar();
    avisar('Pago registrado.');
  } catch (err) {
    $('#error-pago').textContent = err.message; $('#error-pago').hidden = false;
  }
});

// ---------- Eventos generales ----------
$('#filas').addEventListener('click', (e) => {
  const pagar = e.target.dataset.pagar, editar = e.target.dataset.editar;
  if (pagar) abrirPago(gastos.find((g) => g.id == pagar));
  if (editar) abrirGasto(gastos.find((g) => g.id == editar));
});
document.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
$('#nuevo').addEventListener('click', () => abrirGasto());
$('#mes').addEventListener('change', cargar);
$('#busqueda').addEventListener('input', cargar);
$('#filtro-estado').addEventListener('change', cargar);
$('#limpiar').addEventListener('click', () => { $('#busqueda').value = ''; $('#filtro-estado').value = ''; cargar(); });

function vista(gerente) {
  document.body.classList.toggle('gerente', gerente);
  $('#tab-gerente').setAttribute('aria-selected', gerente);
  $('#tab-asistente').setAttribute('aria-selected', !gerente);
}
$('#tab-asistente').addEventListener('click', () => vista(false));
$('#tab-gerente').addEventListener('click', () => vista(true));

$('#mes').value = hoy().slice(0, 7);
cargar().catch((e) => avisar(e.message));
