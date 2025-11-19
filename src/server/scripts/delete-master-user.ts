import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Explicitly point to the .env file in the root

import mongoose from 'mongoose';
import { db, connectDB } from '../database/index.js';

const deleteMasterUser = async () => {
  try {
    console.log('Connecting to the database...');
    await connectDB();
    console.log('Database connection successful.');

    console.log("Searching for user with role: 'master'...");
    const masterUser = await db.users.findOne({ role: 'master' });

    if (masterUser) {
      console.log(`Found master user '${masterUser.username}'. Deleting...`);
      await db.users.deleteOne({ _id: masterUser._id });
      console.log('-----------------------------------');
      console.log(`Master user '${masterUser.username}' deleted successfully.`);
      console.log('-----------------------------------');
    } else {
      console.log("No user with role 'master' found. No action taken.");
    }
  } catch (error) {
    console.error('Error deleting master user:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

deleteMasterUser();
