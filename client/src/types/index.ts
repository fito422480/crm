export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDEDOR' | 'AGENTE';
  zone: string | null;
  phone: string | null;
  disponible?: boolean;
}

export type AttentionStatus =
  | 'PENDIENTE'
  | 'EN_ATENCION'
  | 'ATENDIDO'
  | 'SEGUIMIENTO'
  | 'CERRADO';

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  intent: string | null;
  ciudad: string | null;
  nombreFraccion: string | null;
  manzana: string | null;
  numeroLote: string | null;
  quiereAsesor: boolean;
  quiereVisita: boolean;
  quiereReserva: boolean;
  leadStage: LeadStage;
  leadPriority: LeadPriority;
  leadScore: number;
  ultimoEstado: string | null;
  ultimaActividad: string | null;
  vendedorAsignado: User | null;
  attentionStatus: AttentionStatus;
  attendedBy: User | null;
  attendedAt: string | null;
  zone: string | null;
  notes: string | null;
  events?: LeadEvent[];
  createdAt: string;
  _count?: { interactions: number };
}

export type LeadStage =
  | 'NUEVO' | 'EXPLORANDO_LOTEAMIENTOS' | 'CONSULTO_CUOTAS'
  | 'COMPARANDO_OPCIONES' | 'QUIERE_VISITA' | 'QUIERE_ASESOR'
  | 'RESERVA_POTENCIAL' | 'CERRADO';

export type LeadPriority =
  | 'URGENTE' | 'ALTA' | 'MEDIA' | 'NORMAL' | 'BAJA';

export type LeadEventType =
  | 'ASSIGNED' | 'REASSIGNED' | 'STATUS_CHANGED' | 'ATTENDED' | 'NOTE';

export interface LeadEvent {
  id: string;
  leadId: string;
  userId: string | null;
  user: User | null;
  type: LeadEventType;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  role: 'USER' | 'BOT' | 'AGENT';
  content: string;
  contentType: string;
  intent: string | null;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  departamento: string | null;
  ciudad: string | null;
  lotesDisponibles: number;
  _count?: { lots: number };
}

export interface Lot {
  id: string;
  propertyId: string;
  manzana: string | null;
  numero: string | null;
  status: 'LIBRE' | 'VENDIDO' | 'RESERVADO';
  precio: number | null;
  area: string | null;
}
