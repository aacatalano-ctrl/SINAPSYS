import mongoose from 'mongoose';
import { DoctorModel } from './models/Doctor.model.js';
import { OrderModel } from './models/Order.model.js';
import { UserModel } from './models/User.model.js';
import { NotificationModel } from './models/Notification.model.js';

// MongoDB Connection String (replace with environment variable in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SINAPSYS'; // Use environment variable for production

// Define the structure of the db object with Mongoose Models
interface AppDatabase {
  doctors: typeof DoctorModel;
  orders: typeof OrderModel;
  users: typeof UserModel;
  notifications: typeof NotificationModel;
}

const db: AppDatabase = {
  doctors: DoctorModel,
  orders: OrderModel,
  users: UserModel,
  notifications: NotificationModel,
};

// 3. Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// 4. Function to initialize data if the database is empty
const initializeDb = async (): Promise<void> => {
  try {
    // Initial data insertion logic removed to keep database clean on startup.
    // If you need to insert initial data, you can uncomment or re-add the logic here.
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export {
  db,
  initializeDb,
  connectDB // Export connectDB so it can be called from server.ts
};

// Call connectDB when the module is loaded, but don't initializeDb here
// initializeDb will be called after successful connection in server.ts
