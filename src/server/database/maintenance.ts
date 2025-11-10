import { db } from './index.js';
import { jobTypePrefixMap } from './constants.js';

async function purgeOldOrders(): Promise<void> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const query = {
    status: 'Completado',
    completionDate: { $lt: oneYearAgo.toISOString() },
  };

  try {
    const result = await db.orders.deleteMany(query);
    if (result.deletedCount > 0) {
      console.log(`Successfully purged ${result.deletedCount} old completed orders.`);
    } else {
      console.log('No old completed orders to purge.');
    }
  } catch (err) {
    console.error('Error purging old orders:', err);
  }
}

const initializeCounters = async () => {
  console.log('Initializing order number counters...');

  const prefixes = Object.values(jobTypePrefixMap);
  const year = new Date().getFullYear().toString().slice(-2);

  for (const prefix of prefixes) {
    const counterId = `${prefix}-${year}`;
    const searchPrefix = `${counterId}-`;

    const lastOrder = await db.orders.findOne(
      { orderNumber: { $regex: new RegExp(`^${searchPrefix}`) } },
      {},
      { sort: { orderNumber: -1 } },
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
      { upsert: true },
    );
    console.log(`Counter '${counterId}' initialized to sequence ${maxSeq}.`);
  }
  console.log('Counter initialization complete.');
};

async function cleanupStaleSessions(): Promise<void> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  try {
    const staleUsers = await db.users
      .find({
        isOnline: true,
        lastActiveAt: { $lt: sixHoursAgo },
      })
      .select('_id')
      .lean();

    if (staleUsers.length === 0) {
      console.log('No stale user sessions to clean up.');
      return;
    }

    const userIds = staleUsers.map((user) => user._id);

    const result = await db.users.updateMany(
      { _id: { $in: userIds } },
      { $set: { isOnline: false, socketId: undefined } },
    );

    if (result.modifiedCount > 0) {
      console.log(`Successfully cleaned up ${result.modifiedCount} stale user sessions.`);
    }
  } catch (err) {
    console.error('Error cleaning up stale user sessions:', err);
  }
}

export { purgeOldOrders, initializeCounters, cleanupStaleSessions };
