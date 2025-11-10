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

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // --- ATOMIC UPDATE TO PREVENT RACE CONDITION ---
    const updatedUser = await db.users.findOneAndUpdate(
      { _id: user._id, isOnline: { $ne: true } }, // Condition: Find user only if they are not already online
      { $set: { isOnline: true, lastActiveAt: new Date() } }, // Action: Set them to online
      { new: true }, // Options: Return the document *after* the update
    );

    if (!updatedUser) {
      // If updatedUser is null, it means the condition failed - the user was already online.
      return res
        .status(403)
        .json({ success: false, message: 'El usuario ya tiene una sesión activa.' });
    }
    // --- END OF ATOMIC UPDATE ---

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET!,
      { expiresIn: '1h' },
    );
    res.json({ success: true, user: { username: user.username, role: user.role }, token });
  } catch (error) {
    console.error(`Error during login for user ${username}:`, error);
    res
      .status(500)
      .json({ success: false, message: 'Error del servidor durante el inicio de sesión.' });
  }
});

import { io } from '../server.js';
import authMiddleware from '../middleware/authMiddleware.js';

// GET /me - Protected route to get current user's data
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    const user = await db.users.findById(req.user.userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user data.' });
  }
});

// POST /logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.users.findById(userId);

    if (user && user.socketId) {
      // Use `remoteDisconnect` from the socket.io-redis adapter to disconnect a socket
      // from any server instance in the cluster.
      // We cast to `any` because the method is added dynamically by the adapter and
      // may not be present in the default TypeScript Server type.
      io.remoteDisconnect(user.socketId, true);
      console.log(`Forcing disconnect for socket ID: ${user.socketId}`);
    } else if (user) {
      // Fallback if socketId is not present for some reason
      user.isOnline = false;
      user.socketId = undefined;
      await user.save();
      io.emit('user_status_change', { userId: user._id, isOnline: false });
      console.log(`User ${user.username} set to offline via fallback.`);
    }

    res.status(200).json({ success: true, message: 'Logout initiated.' });
  } catch (error) {
    console.error('Error during manual logout:', error);
    res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
});

export default router;
