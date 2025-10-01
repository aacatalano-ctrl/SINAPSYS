import { db } from './index.js';
import { jobTypePrefixMap } from './constants.js';

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

export const initializeCounters = async () => {
  console.log('Initializing order number counters...');
  
  const prefixes = Object.values(jobTypePrefixMap);
  const year = new Date().getFullYear().toString().slice(-2);

  for (const prefix of prefixes) {
    const counterId = `${prefix}-${year}`;
    const searchPrefix = `${counterId}-`;

    const lastOrder = await db.orders.findOne(
      { orderNumber: { $regex: new RegExp(`^${searchPrefix}`) } },
      {},
      { sort: { orderNumber: -1 } }
    );

    let maxSeq = 0;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSeqStr = lastOrder.orderNumber.split('-')[2];
      if (lastSeqStr) {
        maxSeq = parseInt(lastSeqStr, 10);
      }
    }

    await db.sequences.updateOne(
      { _id: counterId },
      { $setOnInsert: { seq: maxSeq } },
      { upsert: true }
    );
    console.log(`Counter '${counterId}' initialized to sequence ${maxSeq}.`);
  }
  console.log('Counter initialization complete.');
};

export {
  purgeOldOrders,
  initializeCounters,
};