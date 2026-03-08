import { toast } from 'sonner';
import { Clock, ArrowRight } from 'lucide-react';
import { DayOfWeek, ScheduleEntry } from '@/types/device';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScheduleStatus } from '@/lib/scheduleUtils';

const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'Th', Fri: 'F', Sat: 'Sa', Sun: 'Su',
};

interface ScheduleEditorProps {
  schedule?: ScheduleEntry;
  onChange: (schedule: ScheduleEntry) => void;
  scheduleStatus?: ScheduleStatus;
  statusLabel?: string | null;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function condenseDays(days: DayOfWeek[]): string {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && WEEKDAYS.every(d => days.includes(d)) && !days.includes('Sat') && !days.includes('Sun')) return 'Weekdays';
  return days.join(', ');
}

export function ScheduleEditor({ schedule, onChange, scheduleStatus, statusLabel }: ScheduleEditorProps) {
  const current: ScheduleEntry = {
    enabled: true, // Always enabled in scheduled mode
    days: schedule?.days ?? [],
    startTime: schedule?.startTime ?? '08:00',
    endTime: schedule?.endTime ?? '18:00',
  };

  const updateSchedule = (patch: Partial<ScheduleEntry>) => {
    const next = { ...current, ...patch };
    if (next.startTime >= next.endTime) {
      toast.error('Start time must be before end time.');
      return;
    }
    onChange(next);
  };

  const toggleDay = (day: DayOfWeek) => {
    const days = current.days.includes(day)
      ? current.days.filter((d) => d !== day)
      : [...current.days, day];
    onChange({ ...current, days });
  };

  const selectWeekdays = () => {
    onChange({ ...current, days: [...WEEKDAYS] });
  };

  const selectEveryDay = () => {
    onChange({ ...current, days: [...ALL_DAYS] });
  };

  const isWeekdaysSelected = WEEKDAYS.every(d => current.days.includes(d)) && !current.days.includes('Sat') && !current.days.includes('Sun') && current.days.length === 5;
  const isEveryDaySelected = current.days.length === 7;

  return (
    <div className="space-y-4 rounded-xl bg-muted/50 p-4">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <Label className="font-medium text-sm">Schedule</Label>
        {statusLabel && (
          <Badge variant="outline" className={cn(
            'text-xs',
            scheduleStatus === 'active' ? 'text-energy border-energy/30 bg-energy/10' : 'text-muted-foreground border-muted-foreground/30'
          )}>
            {statusLabel}
          </Badge>
        )}
      </div>

      {/* Day selector */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Repeat on</Label>
        <div className="flex gap-1.5 justify-between">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                'w-9 h-9 rounded-full text-xs font-semibold transition-all flex items-center justify-center',
                current.days.includes(day)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background text-muted-foreground border border-border hover:bg-accent hover:text-foreground'
              )}
            >
              {day.charAt(0)}
            </button>
          ))}
        </div>

        {/* Quick select */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isWeekdaysSelected ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 rounded-full"
            onClick={selectWeekdays}
          >
            Weekdays
          </Button>
          <Button
            type="button"
            variant={isEveryDaySelected ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 rounded-full"
            onClick={selectEveryDay}
          >
            Every day
          </Button>
        </div>
      </div>

      {/* Time range */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Active hours</Label>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Start</span>
            <Input
              type="time"
              value={current.startTime}
              onChange={(e) => updateSchedule({ startTime: e.target.value })}
              className="font-mono text-sm h-9 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">End</span>
            <Input
              type="time"
              value={current.endTime}
              onChange={(e) => updateSchedule({ endTime: e.target.value })}
              className="font-mono text-sm h-9 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {current.days.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 text-primary">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <p className="text-xs font-medium">
            {condenseDays(current.days)} · {formatTime12(current.startTime)} – {formatTime12(current.endTime)}
          </p>
        </div>
      )}
    </div>
  );
}
