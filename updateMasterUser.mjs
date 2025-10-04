
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { db } from './src/server/database/index.ts';

// Cargar variables de entorno
dotenv.config();

const MASTER_USER_EMAIL = 'aacatalano@gmail.com'; // <-- ESTE VALOR SE REEMPLAZARÁ

const updateMasterUser = async () => {
  if (MASTER_USER_EMAIL === 'TU_EMAIL_AQUI') {
    console.error('Error: Por favor, reemplaza TU_EMAIL_AQUI en el script con el email real del usuario master.');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI no está definida en el archivo .env');
    return;
  }

  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa.');

    console.log("Buscando al usuario con role: 'master'...");
    const masterUser = await db.users.findOne({ role: 'master' });

    if (masterUser) {
      console.log(`Usuario master encontrado: ${masterUser.username}`);
      if (masterUser.email === MASTER_USER_EMAIL) {
        console.log('El usuario master ya tiene el email correcto. No se necesita ninguna acción.');
      } else {
        masterUser.email = MASTER_USER_EMAIL;
        await masterUser.save();
        console.log(`Email actualizado exitosamente para el usuario ${masterUser.username}.`);
      }
    } else {
      console.error("Error: No se encontró ningún usuario con el rol 'master'.");
    }

  } catch (error) {
    console.error('Ocurrió un error durante el proceso de actualización:', error);
  } finally {
    console.log('Cerrando la conexión a la base de datos.');
    await mongoose.connection.close();
  }
};

updateMasterUser();
