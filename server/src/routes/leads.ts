import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const leadsRouter = Router();

leadsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || '';
    const stage = req.query.stage as string;
    const priority = req.query.priority as string;
    const zone = req.query.zone as string;
    const vendorId = req.query.vendorId as string;
    const attentionStatus = req.query.attentionStatus as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};

    if (req.userRole === 'VENDEDOR') {
      where.vendedorAsignadoId = req.userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { ciudad: { contains: search, mode: 'insensitive' } },
        { nombreFraccion: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (stage) where.leadStage = stage;
    if (priority) where.leadPriority = priority;
    if (zone) where.zone = zone;
    if (vendorId) where.vendedorAsignadoId = vendorId;
    if (attentionStatus) where.attentionStatus = attentionStatus;
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          vendedorAsignado: { select: { id: true, name: true, email: true } },
          attendedBy: { select: { id: true, name: true } },
          _count: { select: { interactions: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'error al obtener leads' });
  }
});

leadsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        vendedorAsignado: { select: { id: true, name: true, email: true, zone: true } },
        attendedBy: { select: { id: true, name: true } },
        interactions: { orderBy: { createdAt: 'asc' } },
        events: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!lead) return res.status(404).json({ error: 'lead no encontrado' });
    res.json(lead);
  } catch {
    res.status(500).json({ error: 'error al obtener lead' });
  }
});

const updateLeadSchema = z.object({
  name: z.string().optional(),
  ciudad: z.string().optional(),
  nombreFraccion: z.string().optional(),
  leadStage: z.enum(['NUEVO', 'EXPLORANDO_LOTEAMIENTOS', 'CONSULTO_CUOTAS', 'COMPARANDO_OPCIONES', 'QUIERE_VISITA', 'QUIERE_ASESOR', 'RESERVA_POTENCIAL', 'CERRADO']).optional(),
  leadPriority: z.enum(['URGENTE', 'ALTA', 'MEDIA', 'NORMAL', 'BAJA']).optional(),
  attentionStatus: z.enum(['PENDIENTE', 'EN_ATENCION', 'ATENDIDO', 'SEGUIMIENTO', 'CERRADO']).optional(),
  vendedorAsignadoId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  quiereAsesor: z.boolean().optional(),
  quiereVisita: z.boolean().optional(),
  quiereReserva: z.boolean().optional(),
  presupuestoCuota: z.string().nullable().optional(),
  proposito: z.string().nullable().optional(),
  formaPago: z.string().nullable().optional(),
});

leadsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateLeadSchema.parse(req.body);

    const data: any = { ...parsed };
    if (parsed.attentionStatus === 'ATENDIDO') {
      data.attendedById = req.userId;
      data.attendedAt = new Date();
    }

    const lead = await prisma.lead.update({ where: { id: req.params.id }, data });

    if (parsed.attentionStatus) {
      await prisma.leadEvent.create({
        data: {
          leadId: lead.id,
          userId: req.userId,
          type: 'STATUS_CHANGED',
          toValue: parsed.attentionStatus,
        },
      });
    }

    if (parsed.vendedorAsignadoId !== undefined) {
      const old = await prisma.lead.findUnique({
        where: { id: req.params.id },
        select: { vendedorAsignadoId: true },
      });
      const fromValue = old?.vendedorAsignadoId;
      const eventType = fromValue && fromValue !== parsed.vendedorAsignadoId ? 'REASSIGNED' : 'ASSIGNED';
      await prisma.leadEvent.create({
        data: {
          leadId: lead.id,
          userId: req.userId,
          type: eventType,
          fromValue: fromValue || undefined,
          toValue: parsed.vendedorAsignadoId || undefined,
        },
      });
    }

    const io = req.app.get('io');
    io?.emit('lead_updated', { leadId: lead.id, ...parsed });

    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'error al actualizar lead' });
  }
});

const changeStatusSchema = z.object({
  attentionStatus: z.enum(['PENDIENTE', 'EN_ATENCION', 'ATENDIDO', 'SEGUIMIENTO', 'CERRADO']),
});

leadsRouter.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { attentionStatus } = changeStatusSchema.parse(req.body);

    const data: any = { attentionStatus };
    if (attentionStatus === 'ATENDIDO') {
      data.attendedById = req.userId;
      data.attendedAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.leadEvent.create({
      data: {
        leadId: lead.id,
        userId: req.userId,
        type: 'STATUS_CHANGED',
        toValue: attentionStatus,
      },
    });

    const io = req.app.get('io');
    io?.emit('lead_updated', { leadId: lead.id, attentionStatus });

    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'error al cambiar estado' });
  }
});

const reassignSchema = z.object({
  vendedorAsignadoId: z.string().min(1),
});

leadsRouter.post('/:id/reassign', async (req: AuthRequest, res: Response) => {
  try {
    const { vendedorAsignadoId } = reassignSchema.parse(req.body);
    const { userRole } = req;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'solo administradores pueden reasignar leads' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: { vendedorAsignadoId: true },
    });
    if (!lead) return res.status(404).json({ error: 'lead no encontrado' });

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { vendedorAsignadoId, attentionStatus: 'PENDIENTE' },
    });

    await prisma.leadEvent.create({
      data: {
        leadId: updated.id,
        userId: req.userId,
        type: 'REASSIGNED',
        fromValue: lead.vendedorAsignadoId || undefined,
        toValue: vendedorAsignadoId,
      },
    });

    const io = req.app.get('io');
    io?.emit('lead_assigned', { leadId: updated.id, vendedorAsignadoId });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'error al reasignar lead' });
  }
});

leadsRouter.get('/:id/events', async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.leadEvent.findMany({
      where: { leadId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'error al obtener eventos' });
  }
});

leadsRouter.get('/:id/interactions', async (req: AuthRequest, res: Response) => {
  try {
    const interactions = await prisma.interaction.findMany({
      where: { leadId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(interactions);
  } catch {
    res.status(500).json({ error: 'error al obtener interacciones' });
  }
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4096),
});

leadsRouter.post('/:id/send-message', async (req: AuthRequest, res: Response) => {
  try {
    const { content } = sendMessageSchema.parse(req.body);
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ error: 'lead no encontrado' });

    const interaction = await prisma.interaction.create({
      data: { leadId: lead.id, role: 'AGENT', content, contentType: 'text' },
    });

    const io = req.app.get('io');
    io?.emit('new_interaction', { leadId: lead.id, interaction });

    res.status(201).json(interaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'error al enviar mensaje' });
  }
});
