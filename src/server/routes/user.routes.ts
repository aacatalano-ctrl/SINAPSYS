import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/index.js';
import { securityQuestionSchema, verifyAnswerSchema, resetPasswordSchema } from '../schemas/auth.schemas.js';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '../schemas/user.schemas.js';
import adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';

const router = Router();

if (!process.env.MASTER_CODE) {
  console.warn('WARNING: MASTER_CODE is not defined. Admin user modification will be restricted.');
}

// Password Recovery Routes
router.post('/security-question', async (req, res) => {
  const validation = securityQuestionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (user) {
      res.json({ success: true, securityQuestion: user.securityQuestion });
    } else {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al buscar la pregunta de seguridad:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al buscar la pregunta de seguridad.' });
  }
});

router.post('/verify-answer', async (req, res) => {
  const validation = verifyAnswerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username, answer } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    const isMatch = await bcrypt.compare(answer, user.securityAnswer!);
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Respuesta de seguridad incorrecta.' });
    }
  } catch (error) {
    console.error('Error al verificar la respuesta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al verificar la respuesta.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const validation = resetPasswordSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username, newPassword } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.users.updateOne({ username }, { $set: { password: hashedPassword } });

    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// User Management Routes

router.post('/', adminAuthMiddleware, async (req, res) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  
  const { password, securityAnswer, role: roleToCreate, ...userData } = validation.data;
  const currentUser = req.user;

  // Rule: Only master can create admin users
  // if (roleToCreate === 'admin' && currentUser.role !== 'master') {
  //   return res.status(403).json({ error: 'Solo el usuario maestro puede crear nuevos administradores.' });
  // }

  // Rule: No one can create a master user via the API
  if (roleToCreate === 'master') {
    return res.status(403).json({ error: 'El rol maestro no se puede asignar a través de la API.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer, 10);
    const newUser = new db.users({ ...userData, role: roleToCreate, password: hashedPassword, securityAnswer: hashedSecurityAnswer });
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear usuario.' });
  }
});

router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await db.users.find({ role: { $ne: 'master' } }, '-password -securityAnswer');
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Error al obtener los usuarios.' });
  }
});

router.put('/:id/status', adminAuthMiddleware, async (req, res) => {
  const validation = updateUserStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { status, masterCode } = validation.data;

  try {
    const userToModify = await db.users.findById(req.params.id);
    if (!userToModify) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (userToModify.role === 'admin') {
      if (masterCode !== process.env.MASTER_CODE) {
        return res.status(403).json({ error: 'Código maestro incorrecto para modificar un usuario administrador.' });
      }
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password -securityAnswer');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del usuario.' });
  }
});

router.put('/:id', adminAuthMiddleware, async (req, res) => {
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { securityAnswer, masterCode, ...updateData } = validation.data;
  const userId = req.params.id;

  try {
    const userToModify = await db.users.findById(userId);
    if (!userToModify) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (masterCode && userToModify.role === 'admin') {
      if (masterCode !== process.env.MASTER_CODE) {
        return res.status(403).json({ error: 'Código maestro incorrecto para modificar un usuario administrador.' });
      }
    }
    
    const finalUpdateData: Partial<typeof updateData> & { securityAnswer?: string } = { ...updateData };

    if (securityAnswer) {
        finalUpdateData.securityAnswer = await bcrypt.hash(securityAnswer, 10);
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      userId,
      finalUpdateData,
      { new: true }
    ).select('-password -securityAnswer');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
});

router.delete('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    const userToDelete = await db.users.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ error: 'Usuario a eliminar no encontrado.' });
    }

    // Rule: Prevent users from deleting themselves
    if (currentUser.userId === userToDelete._id.toString()) {
      return res.status(403).json({ error: 'No puedes eliminar tu propio usuario.' });
    }

    // Rule: Master can delete anyone
    if (currentUser.role === 'master') {
      await db.users.findByIdAndDelete(req.params.id);
      return res.status(204).send();
    }

    // Rule: Admin can delete 'cliente' and 'operador'
    if (currentUser.role === 'admin') {
      if (userToDelete.role === 'admin' || userToDelete.role === 'master') {
        return res.status(403).json({ error: 'Un administrador no puede eliminar a otro administrador o al usuario maestro.' });
      }
      await db.users.findByIdAndDelete(req.params.id);
      return res.status(204).send();
    }

    // Default deny for other roles (e.g., 'cliente', 'operador')
    return res.status(403).json({ error: 'No tienes permiso para eliminar este usuario.' });

  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar el usuario.' });
  }
});

export default router;
