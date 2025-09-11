import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit'; // <--- Añadir esta línea
import { connectDB, initializeDb, db } from './database/index.js';
import { purgeOldOrders } from './database/maintenance.js';
import { checkUnpaidOrders } from './database/notifications.js';
import type { Payment } from '../types.js';

const app = express();
const port = process.env.PORT || 3001;

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
app.post('/api/users', async (req, res) => {
  const { username, password, securityQuestion, securityAnswer } = req.body;
  if (!username || !password || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  try {
    const existingUser = await db.users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer, 10);
    const newUser = new db.users({
      username,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedAnswer,
    });
    await newUser.save();
    res.status(201).json({ username: newUser.username });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el usuario.' });
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
    const isMatch = await bcrypt.compare(password, user.password!); // Fixed
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }
    res.json({ success: true, user: { username: user.username } });
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
    const newOrder = new db.orders(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
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
    const { order, currentUser } = req.body; // Frontend sends order and currentUser

    const doc = new PDFDocument();
    let filename = `Recibo-${orderId}.pdf`;
    filename = encodeURIComponent(filename);
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // --- PDF Content ---
    doc.fontSize(25).text('Recibo de Orden Dental', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Orden ID: ${order.id}`); // Use order.id from frontend for display
    doc.text(`Paciente: ${order.patientName}`);
    doc.text(`Tipo de Trabajo: ${order.jobType}`);
    doc.text(`Costo Total: ${order.cost.toFixed(2)}`);
    doc.moveDown();

    doc.text('Pagos:');
    order.payments.forEach((payment: Payment) => {
      doc.text(`  - Fecha: ${new Date(payment.date).toLocaleDateString()} - Monto: ${payment.amount.toFixed(2)} - Descripción: ${payment.description || 'N/A'}`);
    });
    doc.moveDown();

    const totalPaid = order.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const balance = order.cost - totalPaid;
    doc.text(`Total Abonado: ${totalPaid.toFixed(2)}`);
    doc.text(`Saldo Pendiente: ${balance.toFixed(2)}`);
    doc.moveDown();

    doc.text(`Generado por: ${currentUser.username}`);
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`);
    // --- End PDF Content ---

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
// In production, Vercel handles this with rewrites.
if (process.env.NODE_ENV !== 'production') {
  const staticPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(staticPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });
}

// --- SERVER INITIALIZATION ---
const startServer = async () => {
  await connectDB();
  await initializeDb();

  // Don't listen in a serverless environment
  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Servidor backend escuchando en http://localhost:${port}`);
      
      // Schedule background tasks
      console.log('Scheduling background tasks...');
      // Check for unpaid orders every 24 hours
      setInterval(checkUnpaidOrders, 24 * 60 * 60 * 1000);
      // Purge old orders every 7 days
      setInterval(purgeOldOrders, 7 * 24 * 60 * 60 * 1000);
    });
  }
};

startServer();

export default app;