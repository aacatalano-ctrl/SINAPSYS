import { Router } from 'express';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../controllers/doctors.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getDoctors);
router.post('/', createDoctor);
router.put('/:id', updateDoctor);
router.delete('/:id', authMiddleware, deleteDoctor);

export default router;
