import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db, connectDB } from './src/server/database/index.ts';

dotenv.config();

const createTestUser = async () => {
  try {
    console.log('Connecting to the database...');
    await connectDB();

    const username = 'testuser';
    const password = 'password123';

    const existingUser = await db.users.findOne({ username });
    if (existingUser) {
      console.log(`User '${username}' already exists.`);
      mongoose.connection.close();
      return;
    }

    console.log(`Creating user '${username}'...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash('test', 10);

    const newUser = new db.users({
      username,
      password: hashedPassword,
      nombre: 'Test',
      apellido: 'User',
      cedula: 'V-00000000',
      direccion: 'Test Address',
      razonSocial: 'Test User Inc.',
      rif: 'V000000000',
      securityQuestion: 'test question',
      securityAnswer: hashedSecurityAnswer,
      role: 'cliente',
      status: 'active',
    });

    await newUser.save();
    console.log('-----------------------------------');
    console.log('User \'testuser\' created successfully!');
    console.log('Username: testuser');
    console.log('Password: password123');
    console.log('-----------------------------------');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

createTestUser();
