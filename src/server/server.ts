import express from 'express';
console.log('Serverless function src/server/server.ts started.');
import { IncomingMessage, ServerResponse } from 'http';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import adminAuthMiddleware from './middleware/adminAuthMiddleware.js';
import PDFDocument from 'pdfkit';
import { connectDB, initializeDb, db } from './database/index.js';
import { purgeOldOrders } from './database/maintenance.js';
import { checkUnpaidOrders, createNotification } from './database/notifications.js';
import { jobTypePrefixMap } from './database/constants.js';
import type { Payment } from '../types.js';

// --- SEQUENCE COUNTER SCHEMA ---
const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Sequence = mongoose.model('Sequence', SequenceSchema);

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

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
  console.log('Login attempt received.');
  const { username, password } = req.body;
  if (!username || !password) {
    console.log('Login attempt: Missing username or password.');
    return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos.' });
  }
  try {
    console.log(`Login attempt for user: ${username}`);
    const user = await db.users.findOne({ username });
    if (!user) {
      console.log(`Login attempt for user ${username}: User not found.`);
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    if (user.status === 'blocked') {
      console.log(`Login attempt for user ${username}: User is blocked.`);
      return res.status(403).json({ success: false, message: 'Este usuario ha sido bloqueado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      console.log(`Login attempt for user ${username}: Incorrect password.`);
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log(`Login successful for user: ${username}`);
    res.json({ success: true, user: { username: user.username, role: user.role }, token });
  } catch (error) {
    console.error(`Error during login for user ${username}:`, error);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const isMatch = await bcrypt.compare(answer, user.securityAnswer!);
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Respuesta de seguridad incorrecta.' });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña.' });
  }
});

// --- USER MANAGEMENT (Admin) ---
app.get('/api/users', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await db.users.find({}, '-password -securityAnswer');
    res.json(users);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
});

// --- DOCTORS ---
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.doctors.find({});
    res.json(doctors);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const newDoctor = new db.doctors(req.body);
    await newDoctor.save();
    res.status(201).json(newDoctor);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar doctor.' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const doctorId = req.params.id;

    // Primero, eliminar todas las órdenes asociadas a este doctor
    await db.orders.deleteMany({ doctorId: doctorId }, { session });

    // Luego, eliminar al doctor
    const deletedDoctor = await db.doctors.findByIdAndDelete(doctorId, { session });

    if (!deletedDoctor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    
    await session.commitTransaction();
    session.endSession();

    console.log(`Doctor with ID ${doctorId} and all their associated orders have been deleted.`);
    res.status(204).send();

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error deleting doctor and their orders for ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al eliminar el doctor y sus órdenes asociadas.' });
  }
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
  console.log('Request received for /api/orders.');
  try {
    const orders = await db.orders.find({}).populate('doctorId');
    console.log(`Fetched ${orders.length} orders from DB. Sample:`, orders.length > 0 ? orders[0] : 'None');
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener las órdenes:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes.' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.orders.findById(req.params.id).populate('doctorId');
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    res.json(order);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la orden.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    const category = orderData.jobType.split(' - ')[0].trim();
    const prefix = jobTypePrefixMap[category] || 'ORD';
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
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      console.error("Error de clave duplicada al crear la orden:", error);
      return res.status(500).json({ error: 'Error crítico de numeración de orden. Por favor, contacte a soporte.' });
    }
    console.error("Error creating order:", error);
    res.status(400).json({ error: 'Error al crear la orden.' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await db.orders.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('doctorId');
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    // Immediate notification on completion with balance
    if (req.body.status === 'Completado' && updatedOrder.balance > 0) {
      const message = `La orden ${updatedOrder.orderNumber} fue completada con un saldo pendiente de ${updatedOrder.balance.toFixed(2)}.`;
      // Fire and forget notification creation
      createNotification(updatedOrder._id.toString(), message).catch(console.error);
    }

    res.json(updatedOrder);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar la orden.' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await db.orders.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    res.status(204).send();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la orden.' });
  }
});

// --- PAYMENTS ---
app.post('/api/orders/:orderId/payments', async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment: Payment = req.body;

    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    order.payments.push(payment);
    order.balance -= payment.amount;
    order.paidAmount += payment.amount;

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Error al agregar pago:', error);
    res.status(500).json({ error: 'Error al agregar pago.' });
  }
});

app.delete('/api/orders/:orderId/payments/:paymentId', async (req, res) => {
  try {
    const { orderId, paymentId } = req.params;

    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const paymentIndex = order.payments.findIndex(p => p._id?.toString() === paymentId);
    if (paymentIndex === -1) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    const [deletedPayment] = order.payments.splice(paymentIndex, 1);
    order.balance += deletedPayment.amount;
    order.paidAmount -= deletedPayment.amount;

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ error: 'Error al eliminar pago.' });
  }
});

app.post('/api/orders/:orderId/notes', async (req, res) => {
  try {
    const { orderId } = req.params;
    const note = req.body;

    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    if (!order.notes) {
      order.notes = [];
    }
    order.notes.push(note);

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({ error: 'Error al agregar nota.' });
  }
});

app.post('/api/orders/:orderId/receipt', async (req, res) => {
  try {
    const { order, currentUser } = req.body;

    if (!order || !currentUser) {
      return res.status(400).json({ error: 'Faltan datos de la orden o del usuario.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SINAPSIS Laboratorio Dental', { align: 'center' });
    doc.fontSize(12).text('Recibo de Orden', { align: 'center' });
    doc.moveDown(2);

    // Order Info
    doc.fontSize(14).text(`Orden: ${order.orderNumber}`, { continued: true });
    doc.fontSize(12).text(` - Fecha: ${new Date(order.creationDate).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    doc.text(`Paciente: ${order.patientName}`);
    const doctorName = order.doctorId?.firstName ? `${order.doctorId.firstName} ${order.doctorId.lastName}` : 'N/A';
    doc.text(`Doctor: ${doctorName}`);
    doc.text(`Trabajo: ${order.jobType}`);
    doc.moveDown(2);

    // Financials
    doc.fontSize(16).text('Detalles Financieros', { underline: true });
    doc.moveDown();
    doc.fontSize(12);

    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = 150;
    const amountX = 450;

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Fecha', itemX, doc.y);
    doc.text('Descripción', descriptionX, doc.y, { width: 300 });
    doc.text('Monto', amountX, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown();
    const headerY = doc.y;
    doc.lineCap('butt').moveTo(itemX, headerY).lineTo(550, headerY).stroke();
    
    // Table Rows for Payments
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment: Payment) => {
        const y = doc.y;
        totalPaid += payment.amount;
        doc.text(new Date(payment.date).toLocaleDateString(), itemX, y);
        doc.text(payment.description || '', descriptionX, y, { width: 300 });
        doc.text(`${payment.amount.toFixed(2)}`, amountX, y, { align: 'right' });
        doc.moveDown();
      });
    } else {
        doc.text('No hay pagos registrados.', itemX, doc.y);
        doc.moveDown();
    }
    
    const tableBottomY = doc.y;
    doc.lineCap('butt').moveTo(itemX, tableBottomY).lineTo(550, tableBottomY).stroke();
    doc.moveDown();

    // Totals
    doc.font('Helvetica-Bold');
    const totalsY = doc.y;
    doc.text('Costo Total:', descriptionX, totalsY, { align: 'right', width: 200 });
    doc.text(`${order.cost.toFixed(2)}`, amountX, totalsY, { align: 'right' });
    doc.moveDown();
    doc.text('Total Pagado:', descriptionX, doc.y, { align: 'right', width: 200 });
    doc.text(`${totalPaid.toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.moveDown();
    doc.text('Saldo Pendiente:', descriptionX, doc.y, { align: 'right', width: 200 });
    doc.text(`${(order.cost - totalPaid).toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(3);

    // Footer
    doc.fontSize(10).text(`Recibo generado por: ${currentUser.username}`, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error al generar el recibo PDF:', error);
    res.status(500).json({ error: 'Error al generar el recibo.' });
  }
});

// --- REPORTS ---
app.get('/api/reports/income-breakdown', async (req, res) => {
  try {
    const incomeBreakdown = await db.orders.aggregate([
      {
        $group: {
          _id: '$jobType',
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(incomeBreakdown);
  } catch (error) {
    console.error('Error al generar el reporte de desglose de ingresos:', error);
    res.status(500).json({ error: 'Error al generar el reporte de desglose de ingresos.' });
  }
});

app.get('/api/reports/doctor-performance', async (req, res) => {
  console.log('Request received for /api/reports/doctor-performance.');
  try {
    const doctorPerformance = await db.orders.aggregate([
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            doctorId: '$doctorId',
            doctorName: {
              $cond: {
                if: { $and: ['$doctorInfo.firstName', '$doctorInfo.lastName'] },
                then: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] },
                else: 'N/A'
              }
            }
          },
          totalOrders: { $sum: 1 },
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      },
      {
        $sort: { '_id.doctorName': 1 }
      }
    ]);
    console.log(`Generated doctor performance report. Count: ${doctorPerformance.length}. Sample:`, doctorPerformance.length > 0 ? doctorPerformance[0] : 'None');
    res.json(doctorPerformance);
  } catch (error) {
    console.error('Error al generar el reporte de rendimiento de doctores:', error);
    res.status(500).json({ error: 'Error al generar el reporte de rendimiento de doctores.' });
  }
});

app.get('/api/reports/order-status', async (req, res) => {
  try {
    const orderStatus = await db.orders.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(orderStatus);
  } catch (error) {
    console.error('Error al generar el reporte de estado de órdenes:', error);
    res.status(500).json({ error: 'Error al generar el reporte de estado de órdenes.' });
  }
});

app.get('/api/reports/daily-summary', async (req, res) => {
  try {
    const dailySummary = await db.orders.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(dailySummary);
  } catch (error) {
    console.error('Error al generar el reporte de resumen diario:', error);
    res.status(500).json({ error: 'Error al generar el reporte de resumen diario.' });
  }
});

app.get('/api/reports/pdf/:reportType', async (req, res) => {
  const { reportType } = req.params;
  let data: any[] = [];
  let title = '';

  try {
    switch (reportType) {
      case 'income-breakdown':
        data = await db.orders.aggregate([
          {
            $group: {
              _id: '$jobType',
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        title = 'Reporte de Desglose de Ingresos';
        break;
      case 'doctor-performance':
        data = await db.orders.aggregate([
          {
            $lookup: {
              from: 'doctors',
              localField: 'doctorId',
              foreignField: '_id',
              as: 'doctorInfo'
            }
          },
          {
            $unwind: {
              path: '$doctorInfo',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: {
                doctorId: '$doctorId',
                doctorName: { $ifNull: ['$doctorInfo.name', 'N/A'] }
              },
              totalOrders: { $sum: 1 },
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' }
            }
          },
          { $sort: { '_id.doctorName': 1 } }
        ]);
        title = 'Reporte de Rendimiento de Doctores';
        break;
      case 'order-status':
        data = await db.orders.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        title = 'Reporte de Estado de Órdenes';
        break;
      case 'daily-summary':
        data = await db.orders.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              totalOrders: { $sum: 1 },
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        title = 'Reporte de Resumen Diario';
        break;
      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido.' });
    }

    const doc = new PDFDocument();
    doc.pipe(res);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);

    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();

    data.forEach((item: any) => {
      doc.fontSize(12).text(`ID: ${item._id?.doctorName || item._id || 'N/A'}`);
      doc.text(`Total Órdenes: ${item.totalOrders || item.count || 0}`);
      doc.text(`Ingresos Totales: $${item.totalIncome?.toFixed(2) || '0.00'}`);
      doc.text(`Pagado Total: $${item.totalPaid?.toFixed(2) || '0.00'}`);
      doc.text(`Balance Pendiente: $${item.totalBalance?.toFixed(2) || '0.00'}`);
      doc.moveDown();
    });

    doc.end();

  } catch (error) {
    console.error(`Error al generar el PDF del reporte ${reportType}:`, error);
    res.status(500).json({ error: `Error al generar el PDF del reporte ${reportType}.` });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
  console.log('Request received for /api/notifications.');
  try {
    const notifications = await db.notifications.find({ read: false }).sort({ createdAt: -1 });
    console.log(`Found ${notifications.length} unread notifications.`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNotification = await db.notifications.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }
    res.json(updatedNotification);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída.' });
  }
});

// --- SERVER INITIALIZATION ---
// --- SERVERLESS INITIALIZATION ---
let cachedDb: unknown = null;
let isInitialized = false;

const initializeCounters = async () => {
  console.log('Initializing order number counters...');
  
  const prefixes = Object.values(jobTypePrefixMap);
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

async function connectToDatabase() {
  if (cachedDb) {
    console.log('Using cached database connection.');
    return cachedDb;
  }

  console.log('Attempting to connect to MongoDB...');
  try {
    await connectDB();
    console.log('MongoDB connected successfully.');
    cachedDb = db; // Cache the connected database instance
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error; // Re-throw to indicate failure
  }

  console.log('Attempting to initialize database...');
  try {
    await initializeDb();
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error; // Re-throw to indicate failure
  }

  console.log('Attempting to initialize counters...');
  try {
    await initializeCounters();
    console.log('Counters initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize counters:', error);
    throw error; // Re-throw to indicate failure
  }

  // Schedule background tasks only once if not on Vercel (for local development)
  if (!process.env.VERCEL && !isInitialized) {
    console.log('Scheduling background tasks for local development...');
    setInterval(checkUnpaidOrders, 24 * 60 * 60 * 1000);
    setInterval(purgeOldOrders, 7 * 24 * 60 * 60 * 1000);
    isInitialized = true;
  }

  return cachedDb;
}

// Export a handler function for Vercel
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  console.log('Serverless handler invoked.');
  try {
    await connectToDatabase();
    // Now that the database is connected, let the express app handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless handler initialization failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error during initialization.' }));
  }
}
