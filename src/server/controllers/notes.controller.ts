import { Request, Response } from 'express';
import { db } from '../database/index.js';
import { noteSchema, updateNoteSchema } from '../validation/orders.validation.js';
import type { Note } from '../../types.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'cliente' | 'operador' };
}

export const addNote = async (req: Request, res: Response) => {
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
};

export const updateNote = async (req: Request, res: Response) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const note = (order.notes as any).id(noteId) as Note;
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
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar notas.' });
  }
  try {
    const { orderId, noteId } = req.params;

    const order = await db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    // Use standard array filter to remove the subdocument in a type-safe way
    order.notes = order.notes.filter(note => note._id?.toString() !== noteId);

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error al eliminar la nota:', error);
    res.status(500).json({ error: 'Error al eliminar la nota.' });
  }
};
