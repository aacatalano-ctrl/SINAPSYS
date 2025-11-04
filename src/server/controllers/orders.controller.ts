import { Request, Response } from 'express';
import { db } from '../database/index.js';
import { SequenceModel } from '../database/models/Sequence.model.js';
import { jobTypePrefixMap } from '../database/constants.js';
import { createOrderSchema, updateOrderSchema } from '../validation/orders.validation.js';
import { createNotification } from '../database/notifications.js';
import type { Payment } from '../../types.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'cliente' | 'operador' };
}

export const getOrders = async (req: Request, res: Response) => {
  console.log('Request received for /api/orders.');
  try {
    const orders = await db.orders.find({});
    console.log(`Fetched ${orders.length} orders from DB. Sample:`, orders.length > 0 ? orders[0] : 'None');
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener las órdenes:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes.' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    res.json(order);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la orden.' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const validation = createOrderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const orderData = validation.data; // Use validated data

    const category = orderData.jobType.split(' - ')[0].trim();
    const prefix = jobTypePrefixMap[category] || 'ORD';
    const year = new Date().getFullYear().toString().slice(-2);
    const counterId = `${prefix}-${year}`;

    const counter = await SequenceModel.findOneAndUpdate(
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
    res.status(500).json({ error: 'Error interno del servidor al crear la orden.' }); // Changed 400 to 500 for internal errors
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const validation = updateOrderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const updatedOrder = await db.orders.findByIdAndUpdate(req.params.id, validation.data, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    // Immediate notification on completion with balance
    const currentBalance = updatedOrder.cost - (updatedOrder.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) || 0);
    console.log(`Balance calculado para la orden ${updatedOrder.orderNumber}: ${currentBalance}`);
    if (validation.data.status === 'Completado' && currentBalance > 0) { // Use validated data for status check
      const message = `La orden ${updatedOrder.orderNumber} fue completada con un saldo pendiente de ${currentBalance.toFixed(2)}.`;
      // Fire and forget notification creation
      createNotification(updatedOrder._id.toString(), message).catch(console.error);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la orden.' });
  }
};

export const deleteOrder = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar órdenes.' });
  }
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
};
