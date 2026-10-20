const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/gastos.json');

// Memoria temporal para cuando se ejecute en la nube (Vercel)
let memoriaGastos = [];

const leerDatos = () => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return data ? JSON.parse(data) : memoriaGastos;
    }
  } catch (err) {
    console.log("Servidor en solo lectura, usando memoria.");
  }
  return memoriaGastos;
};

const escribirDatos = (data) => {
  memoriaGastos = data;
  try {
    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (err) {
    console.log("No se pudo escribir en disco (Entorno Serverless/Vercel). Guardado en memoria.");
  }
};

module.exports = { leerDatos, escribirDatos };
