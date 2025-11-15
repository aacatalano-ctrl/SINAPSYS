import { Router } from 'express';
import { db } from '../database/index.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createNotification } from '../database/notifications.js'; // Import createNotification

const router = Router();

// Protect all notification routes
router.use(authMiddleware);

// POST /api/notifications/order-completed
router.post('/order-completed', async (req, res) => {
  const { orderId, message } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId es requerido.' });
  }

  try {
    // Optionally fetch order details to create a more descriptive message
    const order = await db.orders.findById(orderId);
    const notificationMessage =
      message ||
      `La orden ${order?.orderNumber || orderId} para ${order?.patientName || 'un paciente'} ha sido completada.`;

    await createNotification(orderId, notificationMessage);
    res.status(201).json({ message: 'Notificación de orden completada creada con éxito.' });
  } catch (error) {
    console.error('Error creating order completed notification:', error);
    res.status(500).json({ error: 'Error al crear la notificación de orden completada.' });
  }
});

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
