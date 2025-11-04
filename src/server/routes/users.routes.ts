import { Router } from 'express';
import { createUser, getUsers, updateUserStatus, updateUser, deleteUser } from '../controllers/users.controller.js';
import adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';

const router = Router();

router.post('/', createUser);
router.get('/', adminAuthMiddleware, getUsers);
router.put('/:id/status', adminAuthMiddleware, updateUserStatus);
router.put('/:id', adminAuthMiddleware, updateUser);
router.delete('/:id', adminAuthMiddleware, deleteUser);

export default router;
