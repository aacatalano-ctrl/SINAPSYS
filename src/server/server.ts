import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'; // Import Mongoose
import authMiddleware from './middleware/authMiddleware.js';
import adminAuthMiddleware from './middleware/adminAuthMiddleware.js';
import PDFDocument from 'pdfkit';
import { connectDB, initializeDb, db } from './database/index.js';
import { purgeOldOrders } from './database/maintenance.js';
import { checkUnpaidOrders } from './database/notifications.js';
import type { Payment } from '../types.js';

// --- SEQUENCE COUNTER SCHEMA ---
const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Sequence = mongoose.model('Sequence', SequenceSchema);

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('Incoming request URL:', req.url, 'Path:', req.path);
  next();
});

// --- API ENDPOINTS ---

// --- USER AUTHENTICATION ---
app.post('/api/users', adminAuthMiddleware, async (req, res) => {
  const { username, password, securityQuestion, securityAnswer, nombre, apellido, cedula, direccion, razonSocial, rif, role } = req.body;
  if (!username || !password || !securityQuestion || !securityAnswer || !nombre || !apellido || !cedula || !direccion || !razonSocial || !rif) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
    const existingUser = await db.users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Este nombre de usuario ya existe.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer, 10);
    
    const newUser = new db.users({
      username,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedAnswer,
      nombre,
      apellido,
      cedula,
      direccion,
      razonSocial,
      rif,
      role: role || 'user',
      status: 'active',
    });

    await newUser.save();
    res.status(201).json({ username: newUser.username, role: newUser.role, nombre: newUser.nombre, apellido: newUser.apellido, cedula: newUser.cedula, direccion: newUser.direccion, razonSocial: newUser.razonSocial, rif: newUser.rif });
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos.' });
  }
  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Este usuario ha sido bloqueado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password!); // Fixed
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ success: true, user: { username: user.username, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error del servidor durante el inicio de sesión.' });
  }
});

app.post('/api/users/security-question', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await db.users.findOne({ username });
    if (user) {
      res.json({ success: true, securityQuestion: user.securityQuestion });
    } else {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al buscar la pregunta de seguridad.' });
  }
});

app.post('/api/users/verify-answer', async (req, res) => {
  const { username, answer } = req.body;
  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    const isMatch = await bcrypt.compare(answer, user.securityAnswer!); // Fixed
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Respuesta de seguridad incorrecta.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al verificar la respuesta.' });
  }
});

app.post('/api/users/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await db.users.findOneAndUpdate(
      { username },
      { password: hashedPassword },
      { new: true }
    );
    if (updatedUser) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña.' });
  }
});

// --- USER MANAGEMENT (Admin) ---
app.get('/api/users', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await db.users.find({}, '-password -securityAnswer');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios.' });
  }
});

app.put('/api/users/:id/status', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, masterCode } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }

    const userToModify = await db.users.findById(req.params.id);
    if (!userToModify) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (userToModify.role === 'admin') {
      if (masterCode !== '868686') {
        return res.status(403).json({ error: 'Código maestro incorrecto para modificar un usuario administrador.' });
      }
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password -securityAnswer');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del usuario.' });
  }
});

app.put('/api/users/:id', adminAuthMiddleware, async (req, res) => {
  const { username, nombre, apellido, cedula, direccion, razonSocial, rif, role, status, masterCode } = req.body;
  const userId = req.params.id;

  try {
    const userToModify = await db.users.findById(userId);
    if (!userToModify) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (userToModify.role === 'admin') {
      if (masterCode !== '868686') {
        return res.status(403).json({ error: 'Código maestro incorrecto para modificar un usuario administrador.' });
      }
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      userId,
      { username, nombre, apellido, cedula, direccion, razonSocial, rif, role, status },
      { new: true }
    ).select('-password -securityAnswer');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
});

app.delete('/api/users/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const deletedUser = await db.users.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
});

// --- DOCTORS ---
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.doctors.find({});
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const newDoctor = new db.doctors(req.body);
    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
    res.status(400).json({ error: 'Error al agregar doctor' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const updatedDoctor = await db.doctors.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDoctor) {
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    res.json(updatedDoctor);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar doctor.' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const deletedDoctor = await db.doctors.findByIdAndDelete(req.params.id);
    if (!deletedDoctor) {
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar doctor.' });
  }
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.orders.find({}).populate('doctorId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las órdenes.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    const prefixMap: { [key: string]: string } = {
      'PRÓTESIS FIJA': 'PTF',
      'DPR METAL ACRÍLICO': 'DPR',
      'ACRÍLICO': 'ACR',
      'FLEXIBLE': 'FLX',
      'FLUJO DIGITAL': 'DIG',
    };

    const category = orderData.jobType.split(' - ')[0].trim();
    const prefix = prefixMap[category] || 'ORD';
    const year = new Date().getFullYear().toString().slice(-2);
    const counterId = `${prefix}-${year}`;

    const counter = await Sequence.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const sequencePadded = counter.seq.toString().padStart(4, '0');
    const newOrderNumber = `${counterId}-${sequencePadded}`;

    const newOrder = new db.orders({
      ...orderData,
      orderNumber: newOrderNumber,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    if (error.code === 11000) {
      console.error("Error de clave duplicada al crear la orden:", error);
      return res.status(500).json({ error: 'Error crítico de numeración de orden. Por favor, contacte a soporte.' });
    }
    console.error("Error creating order:", error);
    res.status(400).json({ error: 'Error al crear la orden.' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await db.orders.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar la orden.' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await db.orders.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar la orden.' });
  }
});

app.delete('/api/orders/by-date', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas.' });
    }
    const result = await db.orders.deleteMany({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    res.json({ message: `Se eliminaron ${result.deletedCount} órdenes.`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting orders by date:", error);
    res.status(500).json({ error: 'Error al eliminar órdenes por fecha.' });
  }
});

app.post('/api/orders/:id/receipt', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { order, currentUser } = req.body;

    const doc = new PDFDocument();
    let filename = `Recibo-${orderId}.pdf`;
    filename = encodeURIComponent(filename);
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('RECIBO DE ORDEN DENTAL', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Clínica Dental Ejemplo', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Detalles de la Orden:', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(`Orden ID: ${order._id}`);
    doc.text(`Paciente: ${order.patientName}`);
    doc.text(`Tipo de Trabajo: ${order.jobType}`);
    doc.text(`Costo Total: ${order.cost.toFixed(2)}`);
    doc.text(`Estado: ${order.status}`);
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('Pagos Realizados:', { underline: true });
    doc.moveDown(0.5);
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment: Payment) => {
        doc.font('Helvetica').text(`  - Fecha: ${new Date(payment.date).toLocaleDateString()} | Monto: ${payment.amount.toFixed(2)} | Descripción: ${payment.description || 'N/A'}`);
      });
    } else {
      doc.font('Helvetica').text('  No se han registrado pagos.');
    }
    doc.moveDown(1);

    const totalPaid = order.payments ? order.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0) : 0;
    const balance = order.cost - totalPaid;

    doc.fontSize(12).font('Helvetica-Bold').text('Resumen Financiero:', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(`Total Abonado: ${totalPaid.toFixed(2)}`);
    doc.font('Helvetica-Bold').fillColor(balance > 0 ? 'red' : 'green').text(`Saldo Pendiente: ${balance.toFixed(2)}`);
    doc.fillColor('black');
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica').text(`Generado por: ${currentUser.username}`, { align: 'left' });
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'left' });

    doc.end();

  } catch (error) {
    console.error("Error generating PDF receipt:", error);
    res.status(500).json({ error: 'Error al generar el recibo PDF.' });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await db.notifications.find({}).sort({ timestamp: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await db.notifications.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: 'Error al marcar la notificación como leída.' });
  }
});

app.delete('/api/notifications', async (req, res) => {
  try {
    await db.notifications.deleteMany({});
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar todas las notificaciones.' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const deletedNotification = await db.notifications.findByIdAndDelete(req.params.id);
    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar la notificación.' });
  }
});

// --- PAYMENTS ---
app.post('/api/orders/:orderId/payments', async (req, res) => {
  try {
    console.log(`[Backend] POST /api/orders/${req.params.orderId}/payments - req.body:`, req.body);
    const order = await db.orders.findById(req.params.orderId);
    if (order) {
      order.payments.push(req.body);
      await order.save();
      console.log(`[Backend] Payment added to order ${order._id}. New payments array:`, order.payments);
      res.status(201).json(order);
    } else {
      res.status(404).json({ error: 'Orden no encontrada.' });
    }
  } catch (error) {
    console.error('Error al agregar el pago:', error);
    res.status(400).json({ error: 'Error al agregar el pago.' });
  }
});

// --- NOTES ---
app.post('/api/orders/:orderId/notes', async (req, res) => {
  try {
    console.log(`[Backend] POST /api/orders/${req.params.orderId}/notes - req.body:`, req.body);
    const order = await db.orders.findById(req.params.orderId);
    if (order) {
      order.notes.push(req.body);
      await order.save();
      console.log(`[Backend] Note added to order ${order._id}. New notes array:`, order.notes);
      res.status(201).json(order);
    } else {
      res.status(404).json({ error: 'Orden no encontrada.' });
    }
  } catch (error) {
    console.error('Error al agregar la nota:', error);
    res.status(400).json({ error: 'Error al agregar la nota.' });
  }
});

// --- STATIC FILES & SPA FALLBACK (for local development) ---
if (process.env.NODE_ENV !== 'production') {
  const staticPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(staticPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });
}

// --- SERVER INITIALIZATION ---
const initializeCounters = async () => {
  console.log('Initializing order number counters...');
  const prefixMap: { [key: string]: string } = {
    'PRÓTESIS FIJA': 'PTF',
    'DPR METAL ACRÍLICO': 'DPR',
    'ACRÍLICO': 'ACR',
    'FLEXIBLE': 'FLX',
    'FLUJO DIGITAL': 'DIG',
  };

  const prefixes = Object.values(prefixMap);
  const year = new Date().getFullYear().toString().slice(-2);

  for (const prefix of prefixes) {
    const counterId = `${prefix}-${year}`;
    const searchPrefix = `${counterId}-`;

    const lastOrder = await db.orders.findOne(
      { orderNumber: { $regex: new RegExp(`^${searchPrefix}`) } },
      {},
      { sort: { orderNumber: -1 } }
    );

    let maxSeq = 0;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSeqStr = lastOrder.orderNumber.split('-')[2];
      if (lastSeqStr) {
        maxSeq = parseInt(lastSeqStr, 10);
      }
    }

    await Sequence.updateOne(
      { _id: counterId },
      { $setOnInsert: { seq: maxSeq } },
      { upsert: true }
    );
    console.log(`Counter '${counterId}' initialized to sequence ${maxSeq}.`);
  }
  console.log('Counter initialization complete.');
};

const startServer = async () => {
  await connectDB();
  await initializeDb();
  await initializeCounters();

  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Servidor backend escuchando en http://localhost:${port}`);
      
      console.log('Scheduling background tasks...');
      setInterval(checkUnpaidOrders, 24 * 60 * 60 * 1000);
      setInterval(purgeOldOrders, 7 * 24 * 60 * 60 * 1000);
    });
  }
};

startServer();

export default app;
