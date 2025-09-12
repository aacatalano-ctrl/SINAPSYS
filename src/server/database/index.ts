import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Doctor, Order, User, Notification, Payment, Note } from '../../types.js'; // Import necessary types

const saltRounds = 10;

// MongoDB Connection String (replace with environment variable in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SINAPSYS'; // Use environment variable for production

// 1. Define Mongoose Schemas
const paymentSchema = new mongoose.Schema<Payment>({
  amount: { type: Number, required: true },
  date: { type: String, required: true }, // Consider using Date type
  description: { type: String },
});

const noteSchema = new mongoose.Schema<Note>({
  text: { type: String, required: true },
  timestamp: { type: String, required: true }, // Consider using Date type
  author: { type: String, required: true },
});

const doctorSchema = new mongoose.Schema<Doctor>({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
});

const orderSchema = new mongoose.Schema<Order>({
  orderNumber: { type: String, unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientName: { type: String, required: true },
  jobType: { type: String, required: true },
  cost: { type: Number, required: true },
  status: { type: String, required: true },
  creationDate: { type: String, required: true }, // Consider using Date type
  completionDate: { type: String }, // Consider using Date type
  priority: { type: String },
  caseDescription: { type: String },
  payments: [paymentSchema],
  notes: [noteSchema],
});

const userSchema = new mongoose.Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
});

const notificationSchema = new mongoose.Schema<Notification>({
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true }); // Fixed

// 2. Create Mongoose Models
const DoctorModel = mongoose.model<Doctor>('Doctor', doctorSchema);
const OrderModel = mongoose.model<Order>('Order', orderSchema);
const UserModel = mongoose.model<User>('User', userSchema);
const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);

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
