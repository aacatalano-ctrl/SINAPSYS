import { Router } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { db } from '../database/index.js';
import { jobTypePrefixMap } from '../database/constants.js';
import { createNotification } from '../database/notifications.js';
import {
  createOrderSchema,
  updateOrderSchema,
  paymentSchema,
  noteSchema,
  updateNoteSchema,
} from '../schemas/order.schemas.js';
import authMiddleware from '../middleware/authMiddleware.js';
import type { Payment, Note } from '../../types.js';
import logger from '../utils/logger.js';
import { getErrorMessage, getErrorStack } from '../utils/errorUtils.js';

const router = Router();
router.use(authMiddleware);

// --- ORDERS ---
router.get('/', async (req, res) => {
  try {
    const orders = await db.orders.find({}).populate('doctorId', 'firstName lastName');
    res.json(orders);
  } catch (error) {
    logger.error('Error al obtener las órdenes:', {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
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
    logger.error(`Error al obtener la orden con ID ${req.params.id}:`, {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
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

    const counter = await db.sequences.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const sequencePadded = counter.seq.toString().padStart(4, '0');
    const newOrderNumber = `${counterId}-${sequencePadded}`;

    const newOrder = new db.orders({
      ...orderData,
      orderNumber: newOrderNumber,
    });

    await newOrder.save();

    const populatedOrder = await db.orders
      .findById(newOrder._id)
      .populate('doctorId', 'firstName lastName');

    res.status(201).json(populatedOrder);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      logger.error('Error de clave duplicada al crear la orden:', {
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      });
      return res
        .status(500)
        .json({ error: 'Error crítico de numeración de orden. Por favor, contacte a soporte.' });
    }
    logger.error('Error creating order:', {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
    res.status(500).json({ error: 'Error interno del servidor al crear la orden.' });
  }
});

router.put('/:id', async (req, res) => {
  const validation = updateOrderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const updatedOrder = await db.orders
      .findByIdAndUpdate(req.params.id, validation.data, { new: true })
      .populate('doctorId', 'firstName lastName');
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const currentBalance =
      updatedOrder.cost -
      (updatedOrder.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) || 0);
    if (validation.data.status === 'Completado' && currentBalance > 0) {
      const message = `La orden ${updatedOrder.orderNumber} fue completada con un saldo pendiente de ${currentBalance.toFixed(2)}.`;
      createNotification(updatedOrder._id.toString(), message).catch(console.error);
    }

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Error al actualizar la orden:', {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
    res.status(500).json({ error: 'Error interno del servidor al actualizar la orden.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res
      .status(403)
      .json({ error: 'Los operadores no tienen permiso para eliminar órdenes.' });
  }
  try {
    const deletedOrder = await db.orders.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error(`Error al eliminar la orden con ID ${req.params.id}:`, {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
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
    logger.error(`Error al agregar pago a la orden ${req.params.orderId}:`, {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
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
    logger.error(
      `Error al actualizar el pago ${req.params.paymentId} de la orden ${req.params.orderId}:`,
      { error: getErrorMessage(error), stack: getErrorStack(error) },
    );
    res.status(500).json({ error: 'Error interno del servidor al actualizar el pago.' });
  }
});

router.delete('/:orderId/payments/:paymentId', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res
      .status(403)
      .json({ error: 'Los operadores no tienen permiso para eliminar abonos.' });
  }
  try {
    const { orderId, paymentId } = req.params;

    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const paymentIndex = order.payments.findIndex((p) => p._id?.toString() === paymentId);
    if (paymentIndex === -1) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    order.payments.splice(paymentIndex, 1);

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    logger.error(
      `Error al eliminar el pago ${req.params.paymentId} de la orden ${req.params.orderId}:`,
      { error: getErrorMessage(error), stack: getErrorStack(error) },
    );
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
    logger.error(`Error al agregar nota a la orden ${req.params.orderId}:`, {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
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
    note.timestamp = new Date(); // Update timestamp on edit

    await order.save();
    res.json(order);
  } catch (error) {
    logger.error(
      `Error al actualizar la nota ${req.params.noteId} de la orden ${req.params.orderId}:`,
      { error: getErrorMessage(error), stack: getErrorStack(error) },
    );
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

    order.notes = order.notes.filter((note) => note._id?.toString() !== noteId);

    await order.save();
    res.json(order);
  } catch (error) {
    logger.error(
      `Error al eliminar la nota ${req.params.noteId} de la orden ${req.params.orderId}:`,
      { error: getErrorMessage(error), stack: getErrorStack(error) },
    );
    res.status(500).json({ error: 'Error al eliminar la nota.' });
  }
});

// --- PDF ---

/**
 * Generates a receipt PDF for a given order.
 * @param order The order object, populated with doctor details.
 * @param firstName The first name of the user generating the receipt.
 * @param lastName The last name of the user generating the receipt.
 * @returns A Promise that resolves with the PDF buffer.
 */
const generateReceiptPDF = (order: any, firstName: string, lastName: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('RECIBO DE PAGO', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(1);

    // Order Info
    const doctorName =
      order.doctorId && typeof order.doctorId === 'object' && 'firstName' in order.doctorId
        ? `${order.doctorId.firstName} ${order.doctorId.lastName}`
        : 'N/A';

    doc.fontSize(12).font('Helvetica-Bold').text('Orden:', { continued: true }).font('Helvetica').text(` ${order.orderNumber}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Fecha de Creación:', { continued: true }).font('Helvetica').text(` ${new Date(order.creationDate).toLocaleDateString()}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Paciente:', { continued: true }).font('Helvetica').text(` ${order.patientName}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Doctor:', { continued: true }).font('Helvetica').text(` ${doctorName}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Trabajo:', { continued: true }).font('Helvetica').text(` ${order.jobType}`);
    doc.moveDown(2);

    // Financials
    doc.fontSize(16).text('Detalles Financieros', { underline: true });
    doc.moveDown();
    doc.fontSize(12);

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

    // Table Rows for Payments
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment: Payment) => {
        totalPaid += payment.amount;
        const y = doc.y;
        doc.text(new Date(payment.date).toLocaleDateString(), itemX, y);
        doc.text(payment.description || '', descriptionX, y, { width: 300 });
        doc.text(payment.amount.toFixed(2), amountX, y, { align: 'right' });
        doc.moveDown();
      });
    } else {
      doc.text('No hay pagos registrados.', itemX, doc.y);
      doc.moveDown();
    }
    doc.moveDown();

    // Totals
    doc.fontSize(12).font('Helvetica-Bold');
    const totalsX = descriptionX + 200;
    doc.text('Costo Total:', totalsX, doc.y, { align: 'right' });
    doc.text(`${order.cost.toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.moveDown(0.5);
    doc.text('Total Pagado:', totalsX, doc.y, { align: 'right' });
    doc.text(`${totalPaid.toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.moveDown(0.5);
    doc.text('Saldo Pendiente:', totalsX, doc.y, { align: 'right' });
    doc.text(`${(order.cost - totalPaid).toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(3);

    // Signature
    doc.fontSize(10).font('Helvetica').text(`Generado por: ${firstName} ${lastName}`, 50, doc.y, { align: 'left' });

    doc.end();
  });
};

/**
 * Generates a payment history PDF for a given order.
 * @param order The order object, populated with doctor details.
 * @param firstName The first name of the user generating the history.
 * @param lastName The last name of the user generating the history.
 * @returns A Promise that resolves with the PDF buffer.
 */
const generatePaymentHistoryPDF = (order: any, firstName: string, lastName: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('HISTORIAL DE PAGOS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(1);

    // Order Info
    const doctorName =
      order.doctorId && typeof order.doctorId === 'object' && 'firstName' in order.doctorId
        ? `${order.doctorId.firstName} ${order.doctorId.lastName}`
        : 'N/A';
        
    doc.fontSize(12).font('Helvetica-Bold').text('Orden:', { continued: true }).font('Helvetica').text(` ${order.orderNumber}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Fecha de Creación:', { continued: true }).font('Helvetica').text(` ${new Date(order.creationDate).toLocaleDateString()}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Paciente:', { continued: true }).font('Helvetica').text(` ${order.patientName}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Doctor:', { continued: true }).font('Helvetica').text(` ${doctorName}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Trabajo:', { continued: true }).font('Helvetica').text(` ${order.jobType}`);
    doc.moveDown(2);

    // Financials Table
    doc.fontSize(16).text('Historial de Pagos', { underline: true });
    doc.moveDown();
    doc.fontSize(12);

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

    // Table Rows for Payments
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment: Payment) => {
        const y = doc.y;
        doc.text(new Date(payment.date).toLocaleDateString(), itemX, y);
        doc.text(payment.description || '', descriptionX, y, { width: 300 });
        doc.text(payment.amount.toFixed(2), amountX, y, { align: 'right' });
        doc.moveDown();
      });
    } else {
      doc.text('No hay pagos registrados.', itemX, doc.y);
      doc.moveDown();
    }
    doc.moveDown(3);

    // Signature
    doc.fontSize(10).font('Helvetica').text(`Generado por: ${firstName} ${lastName}`, 50, doc.y, { align: 'left' });

    doc.end();
  });
};

router.get('/:orderId/receipt', async (req, res) => {
  try {
    if (!req.user?.nombre || !req.user?.apellido) {
      return res.status(401).json({ error: 'Usuario no autenticado o nombre/apellido no disponible.' });
    }
    const order = await db.orders.findById(req.params.orderId).populate('doctorId', 'firstName lastName');
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const pdfBuffer = await generateReceiptPDF(order, req.user.nombre, req.user.apellido);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${order.orderNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error al generar el recibo PDF para la orden ${req.params.orderId}:`, {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
    res.status(500).json({ error: 'Error al generar el recibo.' });
  }
});

router.get('/:orderId/payment-history-pdf', async (req, res) => {
  try {
    if (!req.user?.nombre || !req.user?.apellido) {
      return res.status(401).json({ error: 'Usuario no autenticado o nombre/apellido no disponible.' });
    }
    const order = await db.orders.findById(req.params.orderId).populate('doctorId', 'firstName lastName');
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const pdfBuffer = await generatePaymentHistoryPDF(order, req.user.nombre, req.user.apellido);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=historial-pagos-${order.orderNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error al generar el PDF de historial de pagos para la orden ${req.params.orderId}:`, {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
    res.status(500).json({ error: 'Error al generar el historial de pagos.' });
  }
});

export default router;
