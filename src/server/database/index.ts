import mongoose from 'mongoose';
import type { Doctor, Order, User, Notification, Payment, Note } from '../../types.js';

// MongoDB Connection String (replace with environment variable in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SINAPSYS'; // Use environment variable for production

// 1. Define Mongoose Schemas
const paymentSchema = new mongoose.Schema<Payment>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String },
});

const noteSchema = new mongoose.Schema<Note>({
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  author: { type: String, required: true },
});

const doctorSchema = new mongoose.Schema<Doctor>({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
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
  creationDate: { type: Date, required: true }, // Consider using Date type
  completionDate: { type: Date }, // Consider using Date type
  priority: { type: String },
  caseDescription: { type: String },
  payments: [paymentSchema],
  notes: [noteSchema],
});

const userSchema = new mongoose.Schema<User>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, required: false },
  password: { type: String, required: true },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  cedula: { type: String, required: true },
  direccion: { type: String, required: true },
  razonSocial: { type: String, required: true },
  rif: { type: String, required: true },
  role: { type: String, enum: ['master', 'admin', 'cliente', 'operador'], default: 'cliente' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  isOnline: { type: Boolean, default: false },
  socketId: { type: String },
  lastActiveAt: { type: Date, default: Date.now },
});

const notificationSchema = new mongoose.Schema<Notification>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

// 2. Create Mongoose Models
const DoctorModel = mongoose.model<Doctor>('Doctor', doctorSchema);
const OrderModel = mongoose.model<Order>('Order', orderSchema);
const UserModel = mongoose.model<User>('User', userSchema);
const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);
const SequenceModel = mongoose.model('Sequence', SequenceSchema);

// Define the structure of the db object with Mongoose Models
interface AppDatabase {
  doctors: typeof DoctorModel;
  orders: typeof OrderModel;
  users: typeof UserModel;
  notifications: typeof NotificationModel;
  sequences: typeof SequenceModel;
}

const db: AppDatabase = {
  doctors: DoctorModel,
  orders: OrderModel,
  users: UserModel,
  notifications: NotificationModel,
  sequences: SequenceModel,
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000; // 5 seconds

let isDatabaseConnected = false; // New flag to track connection status

// 3. Connect to MongoDB
const connectDB = async () => {
  let attempts = 0;
  const connectWithRetry = async () => {
    attempts++;
    try {
      console.log(
        `Attempting to connect to MongoDB (attempt ${attempts}/${MAX_RETRIES}) at:`,
        MONGODB_URI,
      );
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected successfully!');
      isDatabaseConnected = true;
    } catch (err) {
      console.error(`MongoDB connection error (attempt ${attempts}):`, err);
      if (attempts < MAX_RETRIES) {
        console.log(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000} seconds...`);
        setTimeout(connectWithRetry, RETRY_DELAY_MS);
      } else {
        console.error('Max MongoDB connection retries reached. Database is unavailable.');
        isDatabaseConnected = false; // Database remains disconnected
        // Do NOT call process.exit(1) here. The server will continue to run.
      }
    }
  };
  connectWithRetry();
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

export { db, initializeDb, connectDB, isDatabaseConnected };

// Call connectDB when the module is loaded, but don't initializeDb here
// initializeDb will be called after successful connection in server.ts
