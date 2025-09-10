import { db } from './index'; // db is now typed from index.ts

async function purgeOldOrders(): Promise<void> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const query = {
    status: 'Completado',
    completionDate: { $lt: oneYearAgo.toISOString() }
  };

  try {
    const result = await db.orders.deleteMany(query);
    if (result.deletedCount > 0) {
      console.log(`Successfully purged ${result.deletedCount} old completed orders.`);
    } else {
      console.log("No old completed orders to purge.");
    }
  } catch (err) {
    console.error("Error purging old orders:", err);
  }
}

export {
  purgeOldOrders,
};
