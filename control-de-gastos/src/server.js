try { process.loadEnvFile?.(); } catch { /* .env es opcional */ }
const { abrirDB } = require('./db');
const { crearApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = crearApp(abrirDB());
app.listen(PORT, () => console.log(`Control de Gastos en http://localhost:${PORT}`));
