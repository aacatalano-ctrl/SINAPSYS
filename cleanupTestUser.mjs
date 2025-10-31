import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { db, connectDB } from './src/server/database/index.ts';

dotenv.config();

const cleanup = async () => {
  try {
    console.log('Connecting to database for cleanup...');
    await connectDB();
    const user = await db.users.findOne({ username: 'testuser' });
    if (user && user.isOnline) {
      user.isOnline = false;
      await user.save();
      console.log("User 'testuser' has been set to offline.");
    } else if (user) {
      console.log("User 'testuser' was already offline.");
    } else {
      console.log("User 'testuser' not found.");
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed after cleanup.');
  }
};

cleanup();
