import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { db, connectDB } from './src/server/database/index.js';

// Load environment variables from .env file
dotenv.config();

const cleanup = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Resetting isOnline status for all users...');
    const result = await db.users.updateMany(
      {},
      { $set: { isOnline: false, socketId: undefined } }
    );

    console.log(`Cleanup successful. ${result.modifiedCount} users were updated.`);
  } catch (error) {
    console.error('An error occurred during cleanup:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

cleanup();