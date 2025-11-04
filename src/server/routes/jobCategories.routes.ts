import { Router } from 'express';
import { getJobCategories } from '../controllers/jobCategories.controller.js';

const router = Router();

router.get('/', getJobCategories);

export default router;
