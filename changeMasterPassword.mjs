import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db } from './src/server/database/index.ts';

// Cargar variables de entorno
dotenv.config();

const changeMasterPassword = async () => {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('Error: Por favor, proporciona la nueva contraseña como un argumento.');
    console.log('Uso: node changeMasterPassword.mjs <tu-nueva-contraseña>');
    return;
  }

  if (newPassword.length < 6) {
    console.error('Error: La contraseña debe tener al menos 6 caracteres.');
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

      console.log('Generando hash para la nueva contraseña...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      masterUser.password = hashedPassword;
      await masterUser.save();

      console.log(`
----------------------------------------------------------------`);
      console.log(`| ✅ Contraseña actualizada exitosamente para el usuario master. |`);
      console.log(`----------------------------------------------------------------`);

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

changeMasterPassword();
