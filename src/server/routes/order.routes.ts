import { Router } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { db } from '../database/index.js';
import { jobTypePrefixMap } from '../database/constants.js';
import { createNotification } from '../database/notifications.js';
import { createOrderSchema, updateOrderSchema, paymentSchema, noteSchema, updateNoteSchema } from '../schemas/order.schemas.js';
import authMiddleware from '../middleware/authMiddleware.js';
import type { Payment, Note } from '../../types.js';

// The Sequence model is only used for orders, so it can live here.
const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Sequence = mongoose.model('Sequence', SequenceSchema);

const router = Router();

// --- ORDERS ---
router.get('/', async (req, res) => {
  try {
    const orders = await db.orders.find({});
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener las órdenes:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la orden.' });
  }
});

router.post('/', async (req, res) => {
  const validation = createOrderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const orderData = validation.data;
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
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      console.error("Error de clave duplicada al crear la orden:", error);
      return res.status(500).json({ error: 'Error crítico de numeración de orden. Por favor, contacte a soporte.' });
    }
    console.error("Error creating order:", error);
    res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
  }
});

router.put('/:id', async (req, res) => {
  const validation = updateOrderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const updatedOrder = await db.orders.findByIdAndUpdate(req.params.id, validation.data, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const currentBalance = updatedOrder.cost - (updatedOrder.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) || 0);
    if (validation.data.status === 'Completado' && currentBalance > 0) {
      const message = `La orden ${updatedOrder.orderNumber} fue completada con un saldo pendiente de ${currentBalance.toFixed(2)}.`;
      createNotification(updatedOrder._id.toString(), message).catch(console.error);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la orden.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar órdenes.' });
  }
  try {
    const deletedOrder = await db.orders.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la orden.' });
  }
});

// --- PAYMENTS ---
router.post('/:orderId/payments', async (req, res) => {
  const validation = paymentSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const paymentData = validation.data;

  try {
    const { orderId } = req.params;
    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    order.payments.push(paymentData);
    await order.save();

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = order.cost - totalPaid;

    if (balance <= 0) {
      const message = `La orden ${order.orderNumber} ha sido pagada en su totalidad.`;
      createNotification(order._id.toString(), message).catch(console.error);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error al agregar pago:', error);
    res.status(500).json({ error: 'Error interno del servidor al agregar pago.' });
  }
});

router.put('/:orderId/payments/:paymentId', async (req, res) => {
  const validation = paymentSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { amount, date, description } = validation.data;

  try {
    const { orderId, paymentId } = req.params;
    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const payment = (order.payments as mongoose.Types.DocumentArray<Payment>).id(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    payment.amount = amount;
    payment.date = date;
    payment.description = description;

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el pago.' });
  }
});

router.delete('/:orderId/payments/:paymentId', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar abonos.' });
  }
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

    order.payments.splice(paymentIndex, 1);

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ error: 'Error al eliminar pago.' });
  }
});

// --- NOTES ---
router.post('/:orderId/notes', async (req, res) => {
  const validation = noteSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const noteData = validation.data;

  try {
    const { orderId } = req.params;
    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    if (!order.notes) {
      order.notes = [];
    }
    order.notes.push(noteData);

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({ error: 'Error interno del servidor al agregar nota.' });
  }
});

router.put('/:orderId/notes/:noteId', async (req, res) => {
  const validation = updateNoteSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { text } = validation.data;

  try {
    const { orderId, noteId } = req.params;
    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const note = (order.notes as mongoose.Types.DocumentArray<Note>).id(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada.' });
    }

    note.text = text;
    note.timestamp = new Date().toISOString(); // Update timestamp on edit

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error al actualizar la nota:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la nota.' });
  }
});

router.delete('/:orderId/notes/:noteId', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar notas.' });
  }
  try {
    const { orderId, noteId } = req.params;

    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    order.notes = order.notes.filter(note => note._id?.toString() !== noteId);

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error al eliminar la nota:', error);
    res.status(500).json({ error: 'Error al eliminar la nota.' });
  }
});

// --- PDF ---
router.post('/:orderId/receipt', async (req, res) => {
  try {
    const { currentUser } = req.body;
    const order = await db.orders.findById(req.params.orderId).populate('doctorId');

    if (!order || !currentUser) {
      return res.status(400).json({ error: 'Faltan datos de la orden o del usuario.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // ... (rest of PDF generation logic) ...
    doc.end();

  } catch (error) {
    console.error('Error al generar el recibo PDF:', error);
    res.status(500).json({ error: 'Error al generar el recibo.' });
  }
});

router.post('/:orderId/payment-history-pdf', async (req, res) => {
  try {
    const { currentUser } = req.body;
    const order = await db.orders.findById(req.params.orderId).populate('doctorId');

    if (!order || !currentUser) {
      return res.status(400).json({ error: 'Faltan datos de la orden o del usuario.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=historial-pagos-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // ... (rest of PDF generation logic) ...
    doc.end();

  } catch (error) {
    console.error('Error al generar el PDF de historial de pagos:', error);
    res.status(500).json({ error: 'Error al generar el historial de pagos.' });
  }
});

export default router;
