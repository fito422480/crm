import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const usersRouter = Router();

usersRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true, zone: true, disponible: true },
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
        id: true, name: true, email: true, zone: true, disponible: true,
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
      select: { id: true, name: true, email: true, role: true, zone: true, active: true, disponible: true },
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
      select: { id: true, name: true, email: true, role: true, zone: true, disponible: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'error al cambiar disponibilidad' });
  }
});
