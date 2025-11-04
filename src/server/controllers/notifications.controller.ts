import { Request, Response } from 'express';
import { db } from '../database/index.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'cliente' | 'operador' };
}

export const getNotifications = async (req: Request, res: Response) => {
  console.log('Request received for /api/notifications.');
  try {
    const notifications = await db.notifications.find({}).sort({ createdAt: -1 });
    console.log(`Found ${notifications.length} notifications.`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
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
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    await db.notifications.updateMany({}, { read: true });
    res.status(204).send();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas.' });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar notificaciones.' });
  }
  try {
    const { id } = req.params;
    const result = await db.notifications.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Error al eliminar la notificación.' });
  }
};

export const clearAllNotifications = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar notificaciones.' });
  }
  try {
    await db.notifications.deleteMany({});
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ error: 'Error al eliminar todas las notificaciones.' });
  }
};
