import { User, Sun, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OccupancyStatus } from '@/types/device';

interface OccupancyDisplayProps {
  status: OccupancyStatus;
  compact?: boolean;
}

export function OccupancyDisplay({ status, compact = false }: OccupancyDisplayProps) {
  const isOccupied = status === 'occupied';
  
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg transition-colors',
      compact ? 'p-2' : 'p-3',
      isOccupied ? 'bg-occupied/10' : 'bg-muted'
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-full p-1.5',
        isOccupied ? 'bg-occupied text-occupied-foreground' : 'bg-vacant text-vacant-foreground'
      )}>
        <User className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </div>
      <div className="flex flex-col">
        <span className="data-label">Occupancy</span>
        <span className={cn(
          'font-medium capitalize',
          compact ? 'text-sm' : 'text-base',
          isOccupied ? 'text-occupied' : 'text-muted-foreground'
        )}>
          {status}
        </span>
      </div>
    </div>
  );
}

interface LightLevelDisplayProps {
  lux: number;
  compact?: boolean;
}

export function LightLevelDisplay({ lux, compact = false }: LightLevelDisplayProps) {
  const intensity = lux < 200 ? 'low' : lux < 500 ? 'medium' : 'high';
  
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg bg-muted transition-colors',
      compact ? 'p-2' : 'p-3'
    )}>
      <div className="flex items-center justify-center rounded-full p-1.5 bg-sensor-light/20 text-sensor-light">
        <Sun className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </div>
      <div className="flex flex-col">
        <span className="data-label">Light Level</span>
        <div className="flex items-baseline gap-1">
          <span className={cn('font-mono font-semibold', compact ? 'text-sm' : 'text-base')}>
            {lux}
          </span>
          <span className="text-xs text-muted-foreground">lux</span>
          <span className={cn(
            'ml-1 text-xs capitalize',
            intensity === 'low' ? 'text-warning' : intensity === 'medium' ? 'text-muted-foreground' : 'text-sensor-light'
          )}>
            ({intensity})
          </span>
        </div>
      </div>
    </div>
  );
}

interface PowerDisplayProps {
  watts: number;
  isAbnormal?: boolean;
  compact?: boolean;
}

export function PowerDisplay({ watts, isAbnormal = false, compact = false }: PowerDisplayProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg transition-colors',
      compact ? 'p-2' : 'p-3',
      isAbnormal ? 'bg-warning/10' : 'bg-muted'
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-full p-1.5',
        isAbnormal ? 'bg-warning/20 text-warning' : 'bg-sensor-power/20 text-sensor-power'
      )}>
        {isAbnormal ? (
          <AlertTriangle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : (
          <Zap className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
      </div>
      <div className="flex flex-col">
        <span className="data-label">Power Usage</span>
        <div className="flex items-baseline gap-1">
          <span className={cn(
            'font-mono font-semibold',
            compact ? 'text-sm' : 'text-base',
            isAbnormal && 'text-warning'
          )}>
            {watts.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">W</span>
          {isAbnormal && (
            <span className="ml-1 text-xs text-warning font-medium">Abnormal</span>
          )}
        </div>
      </div>
    </div>
  );
}
