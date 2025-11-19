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
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, index: true },
  email: { type: String, sparse: true },
  phone: { type: String, index: true },
  address: { type: String },
});

const jobItemSchema = new mongoose.Schema({
  jobCategory: { type: String, required: true },
  jobType: { type: String, required: true },
  cost: { type: Number, required: true },
  units: { type: Number, required: true, default: 1 }, // Added units field
});

const orderSchema = new mongoose.Schema<Order>({
  orderNumber: { type: String, unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  patientName: { type: String, required: true },
  jobItems: { type: [jobItemSchema], required: true }, // Array of job items
  cost: { type: Number, required: true },
  status: { type: String, required: true, index: true },
  creationDate: { type: Date, required: true, index: true }, // Consider using Date type
  completionDate: { type: Date }, // Consider using Date type
  priority: { type: String },
  caseDescription: { type: String },
  payments: [paymentSchema],
  notes: [noteSchema],
});
orderSchema.index({ doctorId: 1, status: 1, creationDate: -1 }); // Compound index

const userSchema = new mongoose.Schema<User>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, required: false },
  password: { type: String, required: true },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
  nombre: { type: String, required: true, index: true },
  apellido: { type: String, required: true, index: true },
  cedula: { type: String, required: true, unique: true },
  direccion: { type: String, required: true },
  razonSocial: { type: String, required: true },
  rif: { type: String, required: true, unique: true },
  role: { type: String, enum: ['master', 'admin', 'cliente', 'operador'], default: 'cliente', index: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active', index: true },
  isOnline: { type: Boolean, default: false, index: true },
  socketId: { type: String },
  lastActiveAt: { type: Date, default: Date.now },
});

const notificationSchema = new mongoose.Schema<Notification>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
notificationSchema.index({ createdAt: 1 }); // Add index for createdAt

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

let isDatabaseConnected = false; // New flag to track connection status

const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
  maxPoolSize: 5, // Maintain a small pool of connections
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// 3. Connect to MongoDB
const connectDB = async () => {
  // If a connection is already established, do nothing.
  if (mongoose.connection.readyState === 1) {
    if (!isDatabaseConnected) {
      console.log('Using cached database connection.');
      isDatabaseConnected = true;
    }
    return;
  }

  try {
    console.log('No existing connection. Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, MONGOOSE_OPTIONS);
    console.log('MongoDB connected successfully!');
    isDatabaseConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isDatabaseConnected = false; // Ensure flag is false on error
    // We don't re-throw or process.exit here. The app will continue to run,
    // and subsequent API calls will try to connect again.
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

export { db, initializeDb, connectDB, isDatabaseConnected };

// Do not call connectDB here. It will be called on-demand by the serverless function.
