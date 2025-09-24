import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://aacatalano:boxy1983.@sinapsys.rce6a6o.mongodb.net/SINAPSYS?retryWrites=true&w=majority&appName=SINAPSYS';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function cleanup() {
  console.log('Conectando a la base de datos para limpiar usuarios...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa.');

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('La colección de usuarios ya está vacía. No se necesita ninguna acción.');
      return;
    }

    console.log(`Se encontraron ${userCount} usuarios. Eliminando...`);
    const deleteResult = await User.deleteMany({});
    console.log(`Éxito. Se eliminaron ${deleteResult.deletedCount} usuarios.`);

  } catch (error) {
    console.error('Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de la base de datos.');
  }
}

cleanup();
