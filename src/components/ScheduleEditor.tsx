import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { DayOfWeek, ScheduleEntry } from '@/types/device';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ScheduleEditorProps {
  schedule?: ScheduleEntry;
  onChange: (schedule: ScheduleEntry) => void;
}

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const current: ScheduleEntry = {
    enabled: schedule?.enabled ?? false,
    days: schedule?.days ?? [],
    startTime: schedule?.startTime ?? '08:00',
    endTime: schedule?.endTime ?? '10:00',
  };

  const updateSchedule = (patch: Partial<ScheduleEntry>) => {
    const next = { ...current, ...patch };
    if (next.startTime >= next.endTime) {
      toast.error('Invalid time range. Start time must be before end time.');
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

  return (
    <div className="space-y-4 p-3 rounded-lg border">
      {/* Enable repeat schedule */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-muted-foreground" />
          <Label>Repeat Schedule</Label>
        </div>
        <Switch
          checked={current.enabled}
          onCheckedChange={(checked) =>
            onChange({ ...current, enabled: checked })
          }
        />
      </div>

      {current.enabled && (
        <>
          {/* Day selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Repeat on</Label>
            <div className="flex gap-1 flex-wrap">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors border',
                    current.days.includes(day)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent hover:bg-accent'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Active hours</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="time"
                  value={current.startTime}
                  onChange={(e) =>
                    updateSchedule({ startTime: e.target.value })
                  }
                  className="w-28 text-sm font-mono"
                />
              </div>
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="time"
                value={current.endTime}
                onChange={(e) =>
                  updateSchedule({ endTime: e.target.value })
                }
                className="w-28 text-sm font-mono"
              />
            </div>
          </div>

          {/* Summary */}
          {current.days.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Device activates {current.days.join(', ')} from{' '}
              {current.startTime} to {current.endTime}
            </p>
          )}
        </>
      )}
    </div>
  );
}
