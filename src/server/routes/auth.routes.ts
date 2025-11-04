import { Router } from 'express';
import { login, getSecurityQuestion, verifySecurityAnswer, resetPassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/users/security-question', getSecurityQuestion);
router.post('/users/verify-answer', verifySecurityAnswer);
router.post('/users/reset-password', resetPassword);

export default router;
