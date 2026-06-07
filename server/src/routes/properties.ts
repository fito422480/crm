import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export const propertiesRouter = Router();

propertiesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const ciudad = req.query.ciudad as string;
    const departamento = req.query.departamento as string;
    const disponibilidad = req.query.disponibilidad as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ciudad: { contains: search, mode: 'insensitive' } },
        { departamento: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (ciudad) where.ciudad = ciudad;
    if (departamento) where.departamento = departamento;
    if (disponibilidad === 'disponible') where.lotesDisponibles = { gt: 0 };

    const properties = await prisma.property.findMany({
      where,
      include: { _count: { select: { lots: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'error al obtener propiedades' });
  }
});

propertiesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        lots: { orderBy: [{ manzana: 'asc' }, { numero: 'asc' }] },
      },
    });
    if (!property) return res.status(404).json({ error: 'propiedad no encontrada' });
    res.json(property);
  } catch {
    res.status(500).json({ error: 'error al obtener propiedad' });
  }
});

propertiesRouter.get('/:id/lots', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { propertyId: req.params.id };
    if (status) where.status = status;
    const lots = await prisma.lot.findMany({
      where,
      orderBy: [{ manzana: 'asc' }, { numero: 'asc' }],
    });
    res.json(lots);
  } catch {
    res.status(500).json({ error: 'error al obtener lotes' });
  }
});
