import { Router } from 'express';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from '../controllers/notifications.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.put('/mark-all-read', markAllNotificationsAsRead);
router.delete('/:id', authMiddleware, deleteNotification);
router.delete('/', authMiddleware, clearAllNotifications);

export default router;
