import { db } from './index'; // db is now typed from index.ts

function purgeOldOrders(): void {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Define the query type for NeDB remove operation
  interface OrderQuery {
    status: string;
    completionDate: { $lt: string };
  }

  const query: OrderQuery = {
    status: 'Completado',
    completionDate: { $lt: oneYearAgo.toISOString() }
  };

  db.orders.remove(query, { multi: true }, (err: Error | null, numRemoved: number) => {
    if (err) {
      console.error("Error purging old orders:", err);
    } else {
      if (numRemoved > 0) {
        console.log(`Successfully purged ${numRemoved} old completed orders.`);
      } else {
        console.log("No old completed orders to purge.");
      }
    }
  });
}

export {
  purgeOldOrders,
};
