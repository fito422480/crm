import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const vendorFilter = req.userRole === 'VENDEDOR' ? { vendedorAsignadoId: req.userId } : {};

    const [
      totalLeads,
      todayLeads,
      stageCounts,
      priorityCounts,
      vendorCounts,
      recentLeads,
    ] = await Promise.all([
      prisma.lead.count({ where: vendorFilter }),
      prisma.lead.count({
        where: { ...vendorFilter, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.lead.groupBy({ by: ['leadStage'], _count: true, where: vendorFilter }),
      prisma.lead.groupBy({ by: ['leadPriority'], _count: true, where: vendorFilter }),
      prisma.lead.groupBy({ by: ['vendedorAsignadoId'], _count: true, where: vendorFilter }),
      prisma.lead.findMany({
        where: vendorFilter,
        include: { vendedorAsignado: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      totalLeads,
      todayLeads,
      stageCounts,
      priorityCounts,
      vendorCounts,
      recentLeads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'error al obtener estadísticas' });
  }
});
