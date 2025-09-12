

import mongoose from 'mongoose';

// --- CONFIGURACIÓN ---
const MONGODB_URI = 'mongodb+srv://aacatalano:Toto1983.@sinapsys.rce6a6o.mongodb.net/?retryWrites=true&w=majority&appName=SINAPSYS';
// -------------------

// Define un esquema simple solo para poder acceder a la colección
const doctorSchema = new mongoose.Schema({}, { strict: false });
const orderSchema = new mongoose.Schema({}, { strict: false });

const Doctor = mongoose.model('Doctor', doctorSchema);
const Order = mongoose.model('Order', orderSchema);

async function checkCounts() {
  console.log('Conectando a la base de datos en la nube (MongoDB Atlas)...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa.');

    console.log('\nContando documentos...');
    const doctorCount = await Doctor.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log('--------------------');
    console.log(` Doctores encontrados: ${doctorCount}`);
    console.log(` Órdenes encontradas:  ${orderCount}`);
    console.log('--------------------');

  } catch (error) {
    console.error('Error durante la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de la base de datos.');
  }
}

checkCounts();
