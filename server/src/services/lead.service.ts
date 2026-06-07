import { prisma } from '../index';

const ZONA_MAP: Record<string, { vendedor: string; zona: string }> = {
  CAPIATA: { vendedor: 'Carlos', zona: 'CENTRAL' },
  ALTOS: { vendedor: 'Carlos', zona: 'CENTRAL' },
  YAGUARON: { vendedor: 'Carlos', zona: 'CENTRAL' },
  PIRIBEBUY: { vendedor: 'Carlos', zona: 'CENTRAL' },
  EUSEBIO_AYALA: { vendedor: 'Carlos', zona: 'CENTRAL' },
  ARROYOS_Y_ESTEROS: { vendedor: 'Carlos', zona: 'CENTRAL' },
  ENCARNACION: { vendedor: 'Ana', zona: 'ITAPUA' },
  FRAM: { vendedor: 'Ana', zona: 'ITAPUA' },
  TOMAS_ROMERO_PEREIRA: { vendedor: 'Ana', zona: 'ITAPUA' },
  CORONEL_OVIEDO: { vendedor: 'Luis', zona: 'CAAGUAZU' },
  CAAGUAZU: { vendedor: 'Luis', zona: 'CAAGUAZU' },
  MINGA_GUAZU: { vendedor: 'Luis', zona: 'CAAGUAZU' },
};

function normalize(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s,]+/g, '_')
    .trim();
}

export async function asignarVendedor(ciudad: string): Promise<{ vendedorId: string | null; zona: string }> {
  if (!ciudad) return { vendedorId: null, zona: 'GENERAL' };

  const key = normalize(ciudad);
  const match = ZONA_MAP[key];
  if (!match) return { vendedorId: null, zona: 'GENERAL' };

  const vendedor = await prisma.user.findFirst({
    where: { name: match.vendedor, role: 'VENDEDOR', active: true, disponible: true },
    select: { id: true },
  });

  return {
    vendedorId: vendedor?.id || null,
    zona: match.zona,
  };
}

export function calcularScore(data: {
  ciudad?: string;
  nombreFraccion?: string;
  quiereAsesor?: boolean;
  quiereVisita?: boolean;
  quiereReserva?: boolean;
  presupuestoCuota?: string;
  intent?: string;
  proposito?: string;
  rechazoAsesor?: boolean;
}): { score: number; stage: string; priority: string } {
  let score = 0;

  if (data.ciudad) score += 10;
  if (data.nombreFraccion) score += 15;
  if (data.presupuestoCuota) score += 10;
  if (data.proposito) score += 5;
  if (data.intent === 'consultar_financiacion') score += 20;
  if (data.quiereVisita) score += 25;
  if (data.quiereAsesor) score += 30;
  if (data.quiereReserva) score += 40;
  if (data.rechazoAsesor) score -= 10;

  let stage = 'NUEVO';
  let priority = 'NORMAL';

  if (data.quiereReserva) {
    stage = 'RESERVA_POTENCIAL';
    priority = 'URGENTE';
  } else if (data.quiereAsesor) {
    stage = 'QUIERE_ASESOR';
    priority = 'ALTA';
  } else if (data.quiereVisita) {
    stage = 'QUIERE_VISITA';
    priority = 'ALTA';
  } else if (data.intent === 'consultar_financiacion') {
    stage = 'CONSULTO_CUOTAS';
    priority = 'MEDIA';
  } else if (data.intent === 'comparar_opciones') {
    stage = 'COMPARANDO_OPCIONES';
    priority = 'MEDIA';
  } else if (data.intent === 'consultar_fraccion' || data.nombreFraccion) {
    stage = 'EXPLORANDO_LOTEAMIENTOS';
  }

  if (score >= 60) priority = 'ALTA';
  else if (score >= 30 && priority === 'NORMAL') priority = 'MEDIA';

  return { score, stage, priority };
}
