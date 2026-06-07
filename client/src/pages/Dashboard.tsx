import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { DataCard } from '@/components/DataCard';
import { ShimmerSkeletons } from '@/components/ShimmerSkeletons';
import {
  Users, UserCheck, TrendingUp, PhoneCall, MessageSquare,
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip } from 'recharts';

const stageLabels: Record<string, string> = {
  NUEVO: 'Nuevo', EXPLORANDO_LOTEAMIENTOS: 'Explorando', CONSULTO_CUOTAS: 'Consultó cuotas',
  COMPARANDO_OPCIONES: 'Comparando', QUIERE_VISITA: 'Quiere visita',
  QUIERE_ASESOR: 'Quiere asesor', RESERVA_POTENCIAL: 'Reserva potencial', CERRADO: 'Cerrado',
};

const priorityColors: Record<string, string> = {
  URGENTE: 'destructive', ALTA: 'destructive', MEDIA: 'secondary', NORMAL: 'default', BAJA: 'outline',
};

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.dashboard.stats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;
    socket.on('lead_updated', fetchStats);
    socket.on('new_lead', (lead: any) => {
      fetchStats();
      toast(`Nuevo lead: ${lead.name || 'Sin nombre'}`, {
        description: `${lead.phone} · ${lead.ciudad || ''}`,
        action: { label: 'Ver', onClick: () => navigate('/leads') },
      });
    });
    return () => {
      socket.off('lead_updated', fetchStats);
      socket.off('new_lead', () => {});
    };
  }, [socket, fetchStats, navigate]);

  if (loading) return <div className="p-6"><ShimmerSkeletons count={8} height="h-24" /></div>;
  if (!stats) return <div className="p-6">Error al cargar estadísticas</div>;

  const stageData = (stats.stageCounts || []).map((s: any) => ({
    name: stageLabels[s.leadStage] || s.leadStage,
    value: s._count,
  }));

  const priorityData = (stats.priorityCounts || []).map((s: any) => ({
    name: s.leadPriority,
    value: s._count,
  }));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Panel de control de leads y métricas"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
          hidden: {},
        }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <DataCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={<Users className="h-4 w-4" />}
          description="Todos los leads registrados"
          onClick={() => navigate('/leads')}
        />
        <DataCard
          title="Hoy"
          value={stats.todayLeads}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Leads recibidos hoy"
          onClick={() => navigate('/leads')}
        />
        <DataCard
          title="Quieren asesor"
          value={stats.stageCounts?.find((s: any) => s.leadStage === 'QUIERE_ASESOR')?._count || 0}
          icon={<PhoneCall className="h-4 w-4" />}
          description="Solicitaron contacto con asesor"
        />
        <DataCard
          title="Reservas potenciales"
          value={stats.stageCounts?.find((s: any) => s.leadStage === 'RESERVA_POTENCIAL')?._count || 0}
          icon={<UserCheck className="h-4 w-4" />}
          description="Leads con intención de reserva"
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Leads por etapa</CardTitle>
            </CardHeader>
            <CardContent>
              {stageData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stageData.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {stageData.map((s: any, i: number) => (
                      <div key={s.name} className="flex items-center gap-1 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {s.name}: {s.value}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Por prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              {priorityData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <ReTooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {priorityData.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Últimos leads</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentLeads?.length > 0 ? (
              <div className="space-y-1">
                {stats.recentLeads.map((lead: any, i: number) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors -mx-3"
                    onClick={() => navigate('/leads')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lead.name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.ciudad && <Badge variant="outline" className="text-[10px]">{lead.ciudad}</Badge>}
                      <Badge variant={(priorityColors[lead.leadPriority] || 'default') as any} className="text-[10px]">
                        {lead.leadPriority}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay leads aún</p>
                <p className="text-xs">Los leads aparecerán aquí cuando lleguen desde WhatsApp</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
