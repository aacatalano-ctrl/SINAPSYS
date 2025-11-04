import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { db } from '../database/index.js';
import { paymentSchema } from '../validation/orders.validation.js';
import { createNotification } from '../database/notifications.js';
import type { Payment } from '../../types.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'cliente' | 'operador' };
}

export const addPayment = async (req: Request, res: Response) => {
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
};

export const updatePayment = async (req: Request, res: Response) => {
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
};

export const deletePayment = async (req: AuthenticatedRequest, res: Response) => {
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
};
