import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { signToken, authMiddleware, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'credenciales inválidas' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'credenciales inválidas' });
    }
    const token = signToken(user.id, user.role, { name: user.name, email: user.email });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, zone: user.zone },
    });
  } catch (error) {
    res.status(500).json({ error: 'error del servidor' });
  }
});

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, zone } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: 'el email ya está registrado' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role: role || 'VENDEDOR', zone },
    });
    const token = signToken(user.id, user.role, { name: user.name, email: user.email });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, zone: user.zone },
    });
  } catch (error) {
    res.status(500).json({ error: 'error del servidor' });
  }
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, zone: true },
    });
    if (!user) return res.status(404).json({ error: 'usuario no encontrado' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'error del servidor' });
  }
});
