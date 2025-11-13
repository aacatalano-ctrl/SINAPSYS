import { Router } from 'express';
import { db } from '../database/index.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Protect all notification routes
router.use(authMiddleware);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await db.notifications.find({}).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNotification = await db.notifications.findByIdAndUpdate(
      id,
      { read: true },
      { new: true },
    );
    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }
    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída.' });
  }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', async (req, res) => {
  try {
    await db.notifications.updateMany({}, { read: true });
    res.status(204).send();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas.' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res
      .status(403)
      .json({ error: 'Los operadores no tienen permiso para eliminar notificaciones.' });
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
});

// DELETE /api/notifications
router.delete('/', async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res
      .status(403)
      .json({ error: 'Los operadores no tienen permiso para eliminar notificaciones.' });
  }
  try {
    await db.notifications.deleteMany({});
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ error: 'Error al eliminar todas las notificaciones.' });
  }
});

export default router;
