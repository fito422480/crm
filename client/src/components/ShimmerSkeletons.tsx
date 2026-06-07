import { cn } from '@/lib/utils';

interface ShimmerSkeletonsProps {
  count?: number;
  height?: string;
  className?: string;
}

export function ShimmerSkeletons({ count = 3, height = 'h-4', className }: ShimmerSkeletonsProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-md bg-muted relative overflow-hidden',
            height,
            className
          )}
        >
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
