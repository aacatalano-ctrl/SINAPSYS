import { connectDB, db } from './database';

async function debugReports() {
  console.log('Iniciando script de depuración de reportes...');

  try {
    await connectDB();
    console.log('Conectado a la base de datos.');

    console.log('\n--- PASO 1: Datos después de $lookup (unión con doctores) ---');
    const step1_lookup = await db.orders.aggregate([
      {
        $limit: 5 // Limitar a 5 órdenes para una salida manejable
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      }
    ]).exec();
    console.log(JSON.stringify(step1_lookup, null, 2));

    console.log('\n--- PASO 2: Datos después de $unwind (deconstruir doctorInfo) ---');
    const step2_unwind = await db.orders.aggregate([
       {
        $limit: 5
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec();
    console.log(JSON.stringify(step2_unwind, null, 2));

    console.log('\n--- PASO 3: Datos después de $group (agrupación final) ---');
    const step3_group = await db.orders.aggregate([
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$doctorInfo',
          totalOrders: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalPaid: { $sum: { $sum: '$payments.amount' } }
        }
      },
    ]).exec();
    console.log('Resultado de la agrupación:', JSON.stringify(step3_group, null, 2));

    console.log('\n--- Script de depuración finalizado. ---');
    process.exit(0);

  } catch (error) {
    console.error('ERROR DURANTE LA DEPURACIÓN:', error);
    process.exit(1);
  }
}

debugReports();