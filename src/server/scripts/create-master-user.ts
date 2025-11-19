import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Explicitly point to the .env file in the root

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { db, connectDB } from '../database/index.js';

const createMasterUser = async () => {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Error: Please provide a username and password.');
    console.log('Usage: ts-node create-master-user.ts <username> <password>');
    return;
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters long.');
    return;
  }

  try {
    console.log('Connecting to the database...');
    await connectDB();
    console.log('Database connection successful.');

    const existingUser = await db.users.findOne({ $or: [{ username }, { role: 'master' }] });
    if (existingUser) {
      if (existingUser.role === 'master') {
        console.error("Error: A user with the 'master' role already exists.");
      } else {
        console.error(`Error: A user with the username '${username}' already exists.`);
      }
      mongoose.connection.close();
      return;
    }

    console.log(`Creating master user '${username}'...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    // Using a generic hashed answer for the security question
    const hashedSecurityAnswer = await bcrypt.hash('master', 10);

    const newUser = new db.users({
      username,
      password: hashedPassword,
      nombre: 'Master',
      apellido: 'User',
      securityQuestion: 'default question',
      securityAnswer: hashedSecurityAnswer,
      role: 'master',
      status: 'active',
      // Set other fields to default/empty values as they are not critical for a master user
      cedula: 'V-00000000',
      direccion: 'N/A',
      razonSocial: 'N/A',
      rif: 'V000000000',
    });

    await newUser.save();
    console.log('-----------------------------------');
    console.log(`Master user '${username}' created successfully!`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error creating master user:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

createMasterUser();
