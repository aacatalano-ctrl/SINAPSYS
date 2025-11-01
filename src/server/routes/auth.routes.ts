import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/index.js';
import { loginSchema } from '../schemas/auth.schemas.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
}

// POST /login
router.post('/login', async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username, password } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Este usuario ha sido bloqueado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password!)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // --- ATOMIC UPDATE TO PREVENT RACE CONDITION ---
    const updatedUser = await db.users.findOneAndUpdate(
      { _id: user._id, isOnline: { $ne: true } }, // Condition: Find user only if they are not already online
      { $set: { isOnline: true } }, // Action: Set them to online
      { new: true } // Options: Return the document *after* the update
    );

    if (!updatedUser) {
      // If updatedUser is null, it means the condition failed - the user was already online.
      return res.status(403).json({ success: false, message: 'El usuario ya tiene una sesión activa.' });
    }
    // --- END OF ATOMIC UPDATE ---

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET!,
      { expiresIn: '1h' }
    );
    res.json({ success: true, user: { username: user.username, role: user.role }, token });
  } catch (error) {
    console.error(`Error during login for user ${username}:`, error);
    res.status(500).json({ success: false, message: 'Error del servidor durante el inicio de sesión.' });
  }
});

// --- TEMPORARY CLEANUP ENDPOINT ---
router.post('/force-logout-all', async (req, res) => {
  const { masterCode } = req.body;

  if (masterCode !== process.env.MASTER_CODE) {
    return res.status(403).json({ success: false, message: 'Código maestro incorrecto.' });
  }

  try {
    const result = await db.users.updateMany(
      {},
      { $set: { isOnline: false, socketId: undefined } }
    );
    res.json({ success: true, message: `Cleanup successful. ${result.modifiedCount} users were updated.` });
  } catch (error) {
    console.error('Error during force logout:', error);
    res.status(500).json({ success: false, message: 'Error del servidor durante el cleanup.' });
  }
});
// --- END TEMPORARY CLEANUP ENDPOINT ---

export default router;
