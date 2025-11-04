import { Router } from 'express';
// Importamos SOLO la función que realmente existe
import { getReports } from '../controllers/reports.controller.js';

const router = Router();

// Usamos SOLO la ruta que funciona
router.get('/', getReports);

export default router;