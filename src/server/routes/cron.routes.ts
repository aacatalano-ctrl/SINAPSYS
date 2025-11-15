import { Router } from 'express';
import { cleanupOldNotifications } from '../database/notifications.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// This route should be protected by a secret token to prevent unauthorized access
router.get('/cleanup-notifications', async (req, res, next) => {
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not defined. Cron job will not run securely.');
    return next(new AppError('CRON_SECRET is not configured on the server.', 500));
  }

  if (req.headers['x-vercel-cron-event'] !== CRON_SECRET) {
    return next(new AppError('Unauthorized: Invalid cron secret.', 401));
  }

  try {
    await cleanupOldNotifications();
    res.status(200).json({ message: 'Notification cleanup initiated successfully.' });
  } catch (error) {
    console.error('Error running notification cleanup cron:', error);
    next(new AppError('Failed to run notification cleanup.', 500));
  }
});

export default router;
