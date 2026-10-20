const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function abrirDB(archivo = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'gastos.db')) {
  if (archivo !== ':memory:') fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const db = new Database(archivo);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      proveedor TEXT NOT NULL DEFAULT '',
      categoria TEXT NOT NULL DEFAULT '',
      monto REAL NOT NULL CHECK (monto > 0),
      fecha_vencimiento TEXT NOT NULL,          -- AAAA-MM-DD
      fecha_pago TEXT,                          -- NULL = aun no pagado
      observaciones TEXT NOT NULL DEFAULT '',
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_gastos_venc ON gastos (fecha_vencimiento);
  `);
  return db;
}

module.exports = { abrirDB };
