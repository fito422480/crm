import { cn } from '@/lib/utils';

const attentionConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  EN_ATENCION: { label: 'En atención', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  ATENDIDO: { label: 'Atendido', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  SEGUIMIENTO: { label: 'Seguimiento', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  CERRADO: { label: 'Cerrado', className: 'bg-muted text-muted-foreground' },
};

interface Props {
  status: string;
  className?: string;
}

export function AttentionBadge({ status, className }: Props) {
  const config = attentionConfig[status] || attentionConfig.PENDIENTE;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', config.className, className)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        status === 'PENDIENTE' && 'bg-amber-500',
        status === 'EN_ATENCION' && 'bg-blue-500',
        status === 'ATENDIDO' && 'bg-emerald-500',
        status === 'SEGUIMIENTO' && 'bg-purple-500',
        status === 'CERRADO' && 'bg-muted-foreground',
      )} />
      {config.label}
    </span>
  );
}
