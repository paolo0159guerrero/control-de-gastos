const express = require('express');
const path = require('path');
const { crearRouter } = require('./routes/gastos');

function crearApp(db) {
  const app = express();
  app.use(express.json());
  app.use('/api', crearRouter(db));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/api', (req, res) => res.status(404).json({ errores: ['Ruta no encontrada.'] }));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ errores: ['Ocurrió un error inesperado. Intente de nuevo.'] });
  });
  return app;
}

module.exports = { crearApp };
