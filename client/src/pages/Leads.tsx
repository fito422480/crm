import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Send, Phone, MapPin, Building2, UserCheck, ArrowLeft,
  MessageSquare, History, RotateCcw, Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AttentionBadge } from '@/components/AttentionBadge';
import type { Lead, Interaction, LeadEvent, AttentionStatus } from '@/types';

const stageLabels: Record<string, string> = {
  NUEVO: 'Nuevo', EXPLORANDO_LOTEAMIENTOS: 'Explorando', CONSULTO_CUOTAS: 'Consultó cuotas',
  COMPARANDO_OPCIONES: 'Comparando', QUIERE_VISITA: 'Quiere visita',
  QUIERE_ASESOR: 'Quiere asesor', RESERVA_POTENCIAL: 'Reserva potencial', CERRADO: 'Cerrado',
};

const priorityColors: Record<string, string> = {
  URGENTE: 'destructive', ALTA: 'destructive', MEDIA: 'secondary', NORMAL: 'default', BAJA: 'outline',
};

const stageOrder = ['URGENTE', 'ALTA', 'MEDIA', 'NORMAL', 'BAJA'];
const priorityOrder: Record<string, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, NORMAL: 3, BAJA: 4 };

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [attentionFilter, setAttentionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50, sortBy: 'ultimaActividad', sortOrder: 'desc' };
      if (search) params.search = search;
      if (stageFilter) params.stage = stageFilter;
      if (attentionFilter) params.attentionStatus = attentionFilter;
      const data = await api.leads.list(params);
      const sorted = data.leads.sort((a: Lead, b: Lead) => {
        const pa = priorityOrder[a.leadPriority] ?? 99;
        const pb = priorityOrder[b.leadPriority] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(b.ultimaActividad || b.createdAt).getTime() - new Date(a.ultimaActividad || a.createdAt).getTime();
      });
      setLeads(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, attentionFilter]);

  const fetchInteractions = async (leadId: string) => {
    try {
      const data = await api.leads.interactions(leadId);
      setInteractions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async (leadId: string) => {
    try {
      const data = await api.leads.events(leadId);
      setEvents(data);
    } catch {}
  };

  const fetchVendedores = async () => {
    try {
      const data = await api.users.vendedores();
      setVendedores(data);
    } catch {}
  };

  useEffect(() => {
    fetchLeads();
    fetchVendedores();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 400);
    return () => clearTimeout(timer);
  }, [search, stageFilter, attentionFilter]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchLeads();
    socket.on('new_lead', refresh);
    socket.on('lead_updated', (data: any) => {
      if (data?.leadId && selectedLead?.id === data.leadId) {
        setSelectedLead((prev) => prev ? { ...prev, ...data } : prev);
        fetchEvents(data.leadId);
      } else if (data?.id && selectedLead?.id === data.id) {
        setSelectedLead((prev) => prev ? { ...prev, ...data } : prev);
      }
      fetchLeads();
    });
    socket.on('lead_assigned', (data: any) => {
      if (data.leadId === selectedLead?.id) {
        fetchEvents(data.leadId);
      }
      fetchLeads();
    });
    socket.on('new_interaction', (data: any) => {
      if (data.leadId === selectedLead?.id) {
        setInteractions((prev) => [...prev, data.interaction]);
      }
    });
    return () => {
      socket.off('new_lead', refresh);
      socket.off('lead_updated', refresh);
      socket.off('lead_assigned', refresh);
      socket.off('new_interaction', () => {});
    };
  }, [socket, selectedLead?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [interactions.length]);

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowMobileList(false);
    setShowTimeline(false);
    await Promise.all([fetchInteractions(lead.id), fetchEvents(lead.id)]);

    if (lead.attentionStatus === 'PENDIENTE') {
      try {
        await api.leads.changeStatus(lead.id, 'EN_ATENCION');
        setSelectedLead((prev) => prev ? { ...prev, attentionStatus: 'EN_ATENCION' } : prev);
        fetchLeads();
      } catch {}
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedLead) return;
    setSending(true);
    try {
      const interaction = await api.leads.sendMessage(selectedLead.id, message.trim());
      setInteractions((prev) => [...prev, interaction]);
      setMessage('');

      if (selectedLead.attentionStatus === 'EN_ATENCION') {
        await api.leads.changeStatus(selectedLead.id, 'ATENDIDO');
        setSelectedLead((prev) => prev ? { ...prev, attentionStatus: 'ATENDIDO' } : prev);
        fetchEvents(selectedLead.id);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleAssign = async (vendedorId: string) => {
    if (!selectedLead) return;
    try {
      await api.leads.update(selectedLead.id, { vendedorAsignadoId: vendedorId });
      const vendedor = vendedores.find(v => v.id === vendedorId);
      setSelectedLead({ ...selectedLead, vendedorAsignado: vendedor || null });
      setAssignDialogOpen(false);
      fetchEvents(selectedLead.id);
      fetchLeads();
    } catch {}
  };

  const handleNotifyVendor = async (vendorId: string, vendorName: string) => {
    if (!selectedLead) return;
    try {
      const result = await api.leads.notifyVendor(selectedLead.id, vendorId);
      toast.success(`WhatsApp enviado a ${result.vendorName}`);
    } catch (err: any) {
      toast.error(err.message || 'error al notificar');
    }
  };

  const changeAttentionStatus = async (status: string) => {
    if (!selectedLead) return;
    try {
      await api.leads.changeStatus(selectedLead.id, status);
      setSelectedLead((prev) => prev ? { ...prev, attentionStatus: status as AttentionStatus } : prev);
      fetchEvents(selectedLead.id);
      fetchLeads();
    } catch {}
  };

  const updateStage = async (stage: string) => {
    if (!selectedLead) return;
    try {
      await api.leads.update(selectedLead.id, { leadStage: stage });
      setSelectedLead({ ...selectedLead, leadStage: stage as any });
      fetchLeads();
    } catch {}
  };

  const updatePriority = async (priority: string) => {
    if (!selectedLead) return;
    try {
      await api.leads.update(selectedLead.id, { leadPriority: priority });
      setSelectedLead({ ...selectedLead, leadPriority: priority as any });
      fetchLeads();
    } catch {}
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Sidebar - Lista de leads */}
      <div className={`w-full md:w-96 lg:w-[380px] border-r flex flex-col bg-background ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-3 border-b space-y-2">
          <h1 className="text-lg font-bold">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(stageLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={attentionFilter} onValueChange={(v) => setAttentionFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs w-[110px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {['PENDIENTE', 'EN_ATENCION', 'ATENDIDO', 'SEGUIMIENTO', 'CERRADO'].map((k) => (
                  <SelectItem key={k} value={k}>{k.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loading && leads.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : leads.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No hay chats</div>
          ) : (
            leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => handleSelectLead(lead)}
                className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors flex gap-3 ${
                  selectedLead?.id === lead.id ? 'bg-muted' : ''
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>{lead.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{lead.name || 'Sin nombre'}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTime(lead.ultimaActividad || lead.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{lead.phone}</span>
                    {lead.ciudad && <span className="text-xs text-muted-foreground">· {lead.ciudad}</span>}
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                    <AttentionBadge status={lead.attentionStatus} />
                    <Badge variant={priorityColors[lead.leadPriority] as any} className="text-[10px] px-1.5 py-0">
                      {lead.leadPriority}
                    </Badge>
                    {lead.quiereAsesor && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Asesor</Badge>}
                    {lead.quiereVisita && <Badge variant="default" className="text-[10px] px-1.5 py-0">Visita</Badge>}
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Panel principal - Conversación */}
      <div className={`flex-1 flex flex-col ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
        {selectedLead ? (
          <>
            {/* Header del chat */}
            <div className="p-3 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileList(true)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarFallback>{selectedLead.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedLead.name || 'Sin nombre'}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{selectedLead.phone}</span>
                  {selectedLead.attendedBy && (
                    <span className="shrink-0">· Atendido por: <strong>{selectedLead.attendedBy.name}</strong></span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Select value={selectedLead.attentionStatus} onValueChange={changeAttentionStatus}>
                  <SelectTrigger className="h-7 text-xs w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['PENDIENTE', 'EN_ATENCION', 'ATENDIDO', 'SEGUIMIENTO', 'CERRADO'].map((k) => (
                      <SelectItem key={k} value={k}>{k.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLead.leadStage} onValueChange={updateStage}>
                  <SelectTrigger className="h-7 text-xs w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLead.leadPriority} onValueChange={updatePriority}>
                  <SelectTrigger className="h-7 text-xs w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['URGENTE', 'ALTA', 'MEDIA', 'NORMAL', 'BAJA'].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchVendedores}>
                      <UserCheck className="h-3 w-3 mr-1" />
                      {selectedLead.vendedorAsignado?.name || 'Asignar'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar vendedor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {vendedores.map((v) => (
                        <div
                          key={v.id}
                          className={`p-3 rounded-lg border ${
                            selectedLead.vendedorAsignado?.id === v.id ? 'border-primary bg-primary/5' : ''
                          } ${v.disponible === false ? 'opacity-50' : ''}`}
                        >
                          <button
                            onClick={() => handleAssign(v.id)}
                            disabled={v.disponible === false}
                            className="w-full text-left flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'w-2 h-2 rounded-full shrink-0',
                                v.disponible !== false ? 'bg-emerald-500' : 'bg-muted-foreground',
                              )} />
                              <div>
                                <p className="font-medium text-sm">{v.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {v.zone || 'Sin zona'} · {v._count?.assignedLeads || 0} leads activos
                                  {v.disponible === false && ' · No disponible'}
                                </p>
                              </div>
                            </div>
                            {selectedLead.vendedorAsignado?.id === v.id && (
                              <Badge>Actual</Badge>
                            )}
                          </button>
                          {v.phone && (
                            <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground font-mono">{v.phone}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5"
                                onClick={() => handleNotifyVendor(v.id, v.name)}
                              >
                                <Smartphone className="h-3 w-3" />
                                Derivar por WhatsApp
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTimeline(!showTimeline)}>
                  <History className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Datos del lead */}
            {(selectedLead.ciudad || selectedLead.nombreFraccion || selectedLead.manzana || selectedLead.numeroLote) && (
              <div className="px-3 py-2 border-b bg-muted/30 flex gap-3 text-xs text-muted-foreground flex-wrap">
                {selectedLead.ciudad && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedLead.ciudad}</span>}
                {selectedLead.nombreFraccion && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selectedLead.nombreFraccion}</span>}
                {selectedLead.manzana && <span>Mz: {selectedLead.manzana}</span>}
                {selectedLead.numeroLote && <span>Lote: {selectedLead.numeroLote}</span>}
                {selectedLead.quiereAsesor && <Badge variant="destructive" className="text-[10px]">Quiere asesor</Badge>}
                {selectedLead.quiereVisita && <Badge className="text-[10px]">Quiere visita</Badge>}
                {selectedLead.quiereReserva && <Badge variant="default" className="text-[10px]">Quiere reservar</Badge>}
                <span className="text-muted-foreground/50">Score: {selectedLead.leadScore}</span>
              </div>
            )}

            {/* Timeline de eventos */}
            {showTimeline && (
              <div className="border-b bg-muted/20">
                <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Historial</p>
                  {events.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin eventos registrados</p>
                  )}
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-2 text-xs">
                      <div className="mt-1">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          event.type === 'ASSIGNED' && 'bg-blue-500',
                          event.type === 'REASSIGNED' && 'bg-amber-500',
                          event.type === 'STATUS_CHANGED' && 'bg-emerald-500',
                          event.type === 'ATTENDED' && 'bg-purple-500',
                          event.type === 'NOTE' && 'bg-muted-foreground',
                        )} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{event.user?.name || 'Sistema'}</span>{' '}
                        {event.type === 'STATUS_CHANGED' && (
                          <>cambió estado a <strong>{(event.toValue || '').replace(/_/g, ' ')}</strong></>
                        )}
                        {event.type === 'ASSIGNED' && (
                          <>asignó lead a <strong>{vendedores.find(v => v.id === event.toValue)?.name || '—'}</strong></>
                        )}
                        {event.type === 'REASSIGNED' && (
                          <>reasignó de <strong>{vendedores.find(v => v.id === event.fromValue)?.name || '—'}</strong> a{' '}
                            <strong>{vendedores.find(v => v.id === event.toValue)?.name || '—'}</strong></>
                        )}
                        {event.type === 'ATTENDED' && (
                          <>atendió al cliente</>
                        )}
                        {event.type === 'NOTE' && (
                          <>agregó nota</>
                        )}
                        <span className="text-muted-foreground block">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className={`flex ${interaction.role === 'USER' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      interaction.role === 'USER'
                        ? 'bg-muted rounded-bl-sm'
                        : interaction.role === 'AGENT'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary rounded-br-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{interaction.content}</p>
                      <p className={`text-[10px] mt-1 ${interaction.role === 'AGENT' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(interaction.createdAt).toLocaleString()}
                        {interaction.intent && ` · ${interaction.intent}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  placeholder="Escribí un mensaje..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={sending}
                  className="rounded-full"
                />
                <Button size="icon" className="rounded-full" onClick={handleSend} disabled={sending || !message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Seleccioná un chat</p>
              <p className="text-sm">Elegí una conversación de la lista para ver los mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
