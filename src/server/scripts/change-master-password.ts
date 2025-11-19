import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Explicitly point to the .env file in the root

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { db } from '../database/index.js';

const changeMasterPassword = async () => {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('Error: Please provide a new password as an argument.');
    console.log('Usage: ts-node change-master-password.ts <new-password>');
    return;
  }

  if (newPassword.length < 6) {
    console.error('Error: Password must be at least 6 characters long.');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env file');
    return;
  }

  try {
    console.log('Connecting to the database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connection successful.');

    console.log("Searching for user with role: 'master'");
    const masterUser = await db.users.findOne({ role: 'master' });

    if (masterUser) {
      console.log(`Found master user: ${masterUser.username}`);

      console.log('Hashing new password...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      masterUser.password = hashedPassword;
      await masterUser.save();

      console.log(`
----------------------------------------------------------------`);
      console.log(`| ✅ Password updated successfully for the master user. |`);
      console.log(`----------------------------------------------------------------`);

    } else {
      console.error("Error: No user with the 'master' role was found.");
    }
  } catch (error) {
    console.error('An error occurred during the update process:', error);
  } finally {
    console.log('Closing database connection.');
    await mongoose.connection.close();
  }
};

changeMasterPassword();
