import { Router } from 'express';
import { isDatabaseConnected } from '../database/index.js';

const router = Router();

router.get('/status', (req, res) => {
  res.status(200).json({ databaseConnected: isDatabaseConnected });
});

export default router;
