import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { AuthRequest, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

export const usersRouter = Router();

usersRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true, zone: true, phone: true, disponible: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'error al obtener usuarios' });
  }
});

usersRouter.get('/vendedores', async (req: AuthRequest, res: Response) => {
  try {
    const vendedores = await prisma.user.findMany({
      where: { role: 'VENDEDOR', active: true },
      select: {
        id: true, name: true, email: true, zone: true, phone: true, disponible: true,
        _count: { select: { assignedLeads: { where: { leadStage: { not: 'CERRADO' } } } } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(vendedores);
  } catch {
    res.status(500).json({ error: 'error al obtener vendedores' });
  }
});

usersRouter.get('/workload', async (req: AuthRequest, res: Response) => {
  try {
    const vendedores = await prisma.user.findMany({
      where: { role: 'VENDEDOR', active: true },
      select: {
        id: true,
        name: true,
        zone: true,
        disponible: true,
        _count: {
          select: {
            assignedLeads: { where: { leadStage: { not: 'CERRADO' } } },
            attendedLeads: { where: { attentionStatus: { not: 'CERRADO' } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const porEstado = await prisma.lead.groupBy({
      by: ['vendedorAsignadoId', 'attentionStatus'],
      _count: { id: true },
      where: {
        vendedorAsignadoId: { not: null },
        attentionStatus: { not: 'CERRADO' },
      },
    });

    const stats = vendedores.map((v) => {
      const estados = porEstado
        .filter((e) => e.vendedorAsignadoId === v.id)
        .reduce(
          (acc, e) => {
            const key = e.attentionStatus?.toLowerCase() || 'pendiente';
            acc[key as string] = e._count.id;
            return acc;
          },
          {} as Record<string, number>,
        );

      return {
        id: v.id,
        name: v.name,
        zone: v.zone,
        disponible: v.disponible,
        asignados: v._count.assignedLeads,
        atendidos: v._count.attendedLeads,
        pendientes: estados['pendiente'] || 0,
        enAtencion: estados['en_atencion'] || 0,
        seguimiento: estados['seguimiento'] || 0,
      };
    });

    res.json(stats);
  } catch {
    res.status(500).json({ error: 'error al obtener carga laboral' });
  }
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'VENDEDOR', 'AGENTE']),
  zone: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  disponible: z.boolean().optional(),
});

usersRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(400).json({ error: 'el email ya está registrado' });
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, zone: true, phone: true, active: true, disponible: true },
    });
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'datos inválidos', details: error.errors });
    res.status(500).json({ error: 'error al crear usuario' });
  }
});

usersRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.userId) return res.status(400).json({ error: 'no puedes eliminarte a ti mismo' });
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'usuario no encontrado' });
    await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false, disponible: false },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'error al eliminar usuario' });
  }
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  zone: z.string().nullable().optional(),
  active: z.boolean().optional(),
  disponible: z.boolean().optional(),
});

usersRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed,
      select: { id: true, name: true, email: true, role: true, zone: true, phone: true, active: true, disponible: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'error al actualizar usuario' });
  }
});

usersRouter.patch('/:id/availability', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.id;
    const currentUser = req.userId;

    if (currentUser !== targetId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'no autorizado' });
    }

    const user = await prisma.user.findUnique({ where: { id: targetId }, select: { disponible: true } });
    if (!user) return res.status(404).json({ error: 'usuario no encontrado' });

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { disponible: !user.disponible },
      select: { id: true, name: true, email: true, role: true, zone: true, phone: true, disponible: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'error al cambiar disponibilidad' });
  }
});
