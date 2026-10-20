# Control de Gastos

Sistema web sencillo para **registrar y controlar los pagos** de un negocio: qué se debe pagar, cuándo vence y si ya se registró como pagado. **No mueve dinero**: la asistente paga por el medio habitual y luego registra la fecha de pago.

## Funciones (PMV)
- **Asistente:** registrar gastos, ver primero los pendientes más próximos a vencer, registrar pagos, corregir datos, buscar y filtrar.
- **Gerente:** consultar los gastos del mes con su estado y el resumen (total, pagado, pendiente y vencido).

## Reglas de estado
| Estado | Regla |
|--------|-------|
| Pagado | Tiene fecha de pago registrada |
| Vencido | No pagado y vencimiento anterior a hoy |
| Pendiente | No pagado y vencimiento hoy o posterior |

Los gastos se agrupan por **mes de vencimiento**.

## Tecnologías
Node.js · Express · SQLite (`better-sqlite3`) · HTML/CSS/JS sin framework.

## Estructura
```
control-de-gastos/
├── data/                 # Base SQLite (se crea sola, no se sube a Git)
├── docs/product-backlog.md
├── public/               # Frontend
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
├── src/
│   ├── server.js         # Arranque
│   ├── app.js            # Configuración de Express
│   ├── db.js             # Conexión y tabla
│   ├── routes/gastos.js  # API REST
│   └── utils/            # estado.js (reglas) y validar.js
├── tests/api.test.js
├── .env.example
└── package.json
```

## Cómo ejecutarlo
```bash
npm install
cp .env.example .env     # opcional
npm start                # http://localhost:3000
npm test
```

## API
| Método | Ruta | Historia |
|--------|------|----------|
| GET | `/api/gastos?mes=AAAA-MM&q=&estado=` | HU-02, 03, 06 |
| POST | `/api/gastos` | HU-01 |
| PUT | `/api/gastos/:id` | HU-05 |
| PATCH | `/api/gastos/:id/pago` | HU-04 |
| GET | `/api/resumen?mes=AAAA-MM` | HU-07 |

## Demostración del PMV
1. Registre tres gastos con distintos montos y vencimientos (uno con fecha pasada).
2. Revise la lista: el vencido y el próximo a vencer aparecen destacados arriba.
3. Use **Registrar pago** en uno y compruebe que pasa a Pagado.
4. Cambie a la vista **Gerente** para ver estados y totales.
