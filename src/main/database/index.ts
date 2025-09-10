import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Doctor, Order, User, Notification, Payment, Note } from '../../types.ts'; // Import necessary types

const saltRounds = 10;

// MongoDB Connection String (replace with environment variable in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_lab_app'; // Use environment variable for production

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
    const doctorCount = await db.doctors.countDocuments({});
    if (doctorCount === 0) {
      console.log('Doctors collection is empty, inserting initial data...');
      const initialDoctors: Partial<Doctor>[] = [
        { title: 'Dr.', firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@example.com', phone: '555-1234', address: 'Calle Falsa 123, Caracas' },
        { title: 'Dra.', firstName: 'María', lastName: 'García', email: '555-5678', address: 'Av. Siempre Viva 456, Maracaibo' },
        { title: 'Est.', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@example.com', phone: '555-9012', address: 'Blvd. de los Sueños 789, Valencia' },
      ];
      const newDocs = await db.doctors.insertMany(initialDoctors as Doctor[]);
      console.log('Initial doctors inserted.');

      const orderCount = await db.orders.countDocuments({});
      if (orderCount === 0) {
        console.log('Orders collection is empty, inserting initial data...');
        const initialOrders: Partial<Order>[] = [
          {
            doctorId: newDocs[0]._id, patientName: 'Ana Rodríguez', jobType: 'PRÓTESIS FIJA - Corona Total Cerámica (DISILICATO)',
            cost: 1200, status: 'Procesando', creationDate: '2025-07-20T10:00:00Z',
            priority: 'Alta', caseDescription: 'Paciente requiere corona total de disilicato.',
            payments: [{ amount: 500, date: '2025-07-20', description: 'Depósito inicial' } as Payment],
            notes: [{ text: 'Paciente requiere corona total de disilicato.', timestamp: '2025-07-20T10:00:00Z', author: 'Usuario' } as Note]
          },
          {
            doctorId: newDocs[1]._id, patientName: 'Luis Fernández', jobType: 'ACRÍLICO - Prótesis Totales',
            cost: 300, status: 'Completado', creationDate: '2025-07-25T14:30:00Z',
            completionDate: '2025-07-28T16:00:00Z',
            priority: 'Normal', caseDescription: 'Prótesis totales para paciente.',
            payments: [{ amount: 300, date: '2025-07-25', description: 'Pago completo' } as Payment],
            notes: []
          },
          {
            doctorId: newDocs[0]._id, patientName: 'Sofía Martínez', jobType: 'FLEXIBLE - De 1 a 6 Unidades',
            cost: 400, status: 'Pendiente', creationDate: '2025-08-01T09:15:00Z',
            priority: 'Urgente', caseDescription: 'Prótesis flexible de 3 unidades.',
            payments: [{ amount: 100, date: '2025-08-01', description: 'Anticipo' } as Payment],
            notes: [{ text: 'Caso complejo, requiere seguimiento.', timestamp: '2025-08-01T14:30:00Z', author: 'Usuario' } as Note]
          },
          {
            doctorId: newDocs[2]._id, patientName: 'Pedro Gómez', jobType: 'FLUJO DIGITAL - Corona Impresa',
            cost: 250, status: 'Pendiente', creationDate: '2025-08-05T11:00:00Z',
            priority: 'Baja', caseDescription: 'Corona impresa para premolar.',
            payments: [],
            notes: []
          },
        ];
        await db.orders.insertMany(initialOrders as Order[]);
        console.log('Initial orders inserted.');
      }
    }

    const userCount = await db.users.countDocuments({});
    if (userCount === 0) {
      console.log('Users collection is empty, inserting initial data with hashed passwords...');
      const initialUsers: User[] = [
        { username: 'admin', password: bcrypt.hashSync('password', saltRounds), securityQuestion: '¿Cuál es el nombre de tu primera mascota?', securityAnswer: bcrypt.hashSync('Buddy', saltRounds) },
        { username: 'user1', password: bcrypt.hashSync('pass1', saltRounds), securityQuestion: '¿Cuál es tu color favorito?', securityAnswer: bcrypt.hashSync('Azul', saltRounds) },
      ];
      await db.users.insertMany(initialUsers);
      console.log('Initial users inserted.');
    }
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
