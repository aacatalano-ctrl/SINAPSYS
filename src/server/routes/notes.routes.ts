import { Router } from 'express';
import { addNote, updateNote, deleteNote } from '../controllers/notes.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/:orderId/notes', addNote);
router.put('/:orderId/notes/:noteId', updateNote);
router.delete('/:orderId/notes/:noteId', authMiddleware, deleteNote);

export default router;
