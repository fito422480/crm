import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { asignarVendedor, calcularScore } from '../services/lead.service';

export const webhookRouter = Router();

webhookRouter.post('/n8n/lead', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const phone = data.telefono || data.phone || '';
    if (!phone) return res.status(400).json({ error: 'telefono requerido' });

    const ciudad = data.ciudad || data.context?.ciudad_interes || '';
    const nombreFraccion = data.nombre_fraccion || data.context?.fraccion_interes || '';
    const quiereAsesor = Boolean(data.quiere_asesor);
    const quiereVisita = Boolean(data.quiere_visita);
    const quiereReserva = Boolean(data.quiere_reserva);
    const presupuestoCuota = data.presupuesto_cuota || data.context?.presupuesto_cuota || '';
    const intent = data.intent || data.ultimo_estado || '';
    const proposito = data.proposito || data.context?.proposito || '';
    const rechazoAsesor = Boolean(data.rechaza_asesor || data.context?.rechazo_asesor);

    const { score, stage, priority } = calcularScore({
      ciudad, nombreFraccion, quiereAsesor, quiereVisita,
      quiereReserva, presupuestoCuota, intent, proposito, rechazoAsesor,
    });

    const { vendedorId, zona } = await asignarVendedor(ciudad);

    const leadData = {
      phone,
      name: data.nombre || data.name || '',
      intent,
      ciudad,
      nombreFraccion,
      manzana: data.manzana || '',
      numeroLote: data.numero_lote || '',
      quiereAsesor,
      quiereVisita,
      quiereReserva,
      presupuestoCuota,
      proposito,
      leadStage: stage as any,
      leadPriority: priority as any,
      leadScore: score,
      ultimoEstado: intent,
      ultimaActividad: new Date(),
      zone: zona,
      vendedorAsignadoId: vendedorId,
      context: data.context || {},
      memory: data.memory || {},
    };

    const existing = await prisma.lead.findUnique({ where: { phone } });

    let lead;
    let isNew = false;

    if (existing) {
      lead = await prisma.lead.update({
        where: { phone },
        data: leadData,
      });
    } else {
      lead = await prisma.lead.create({ data: leadData as any });
      isNew = true;
    }

    if (data.mensaje_original || data.mensaje) {
      const content = data.mensaje_original || data.mensaje || '';
      await prisma.interaction.create({
        data: {
          leadId: lead.id,
          role: 'USER',
          content: typeof content === 'string' ? content : JSON.stringify(content),
          contentType: 'text',
          intent: data.intent || '',
          metadata: { raw: data },
        },
      });
    }

    if (isNew && vendedorId) {
      await prisma.leadEvent.create({
        data: {
          leadId: lead.id,
          type: 'ASSIGNED',
          toValue: vendedorId,
        },
      });
    }

    const leadConVendedor = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        vendedorAsignado: { select: { id: true, name: true, email: true } },
        _count: { select: { interactions: true } },
      },
    });

    const io = req.app?.get('io');
    if (io) {
      if (isNew) io.emit('new_lead', leadConVendedor);
      io.emit('lead_updated', leadConVendedor);
      if (vendedorId) io.emit('lead_assigned', { lead: leadConVendedor, vendedorId });
    }

    res.json({ success: true, leadId: lead.id, isNew, assignedTo: vendedorId, score, stage, priority });
  } catch (error) {
    console.error('webhook error:', error);
    res.status(500).json({ error: 'error procesando webhook' });
  }
});

webhookRouter.post('/n8n/interaction', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const phone = data.telefono || data.phone;
    if (!phone) return res.status(400).json({ error: 'telefono requerido' });

    const lead = await prisma.lead.findUnique({ where: { phone } });
    if (!lead) return res.status(404).json({ error: 'lead no encontrado' });

    const content = data.mensaje || data.content || data.output || '';
    const role = data.role || (data.es_bot ? 'BOT' : 'USER');

    if (content) {
      await prisma.interaction.create({
        data: {
          leadId: lead.id,
          role: role.toUpperCase() === 'BOT' ? 'BOT' : 'USER',
          content: typeof content === 'string' ? content : JSON.stringify(content),
          contentType: data.content_type || 'text',
          intent: data.intent || '',
          metadata: { raw: data },
        },
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: { ultimaActividad: new Date() },
      });
    }

    const io = req.app?.get('io');
    if (io) {
      io.emit('lead_updated', { id: lead.id, ultimaActividad: new Date() });
      io.emit('new_interaction', { leadId: lead.id, interaction: { content, role, createdAt: new Date() } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('webhook interaction error:', error);
    res.status(500).json({ error: 'error procesando interacción' });
  }
});
