import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { SmartPlug } from '@/types/device';
import { getScheduleStatus } from '@/lib/scheduleUtils';
import { getNextScheduleBoundary } from '@/lib/scheduleUtils';

interface ScheduleCountdownProps {
  device: SmartPlug;
}

export function ScheduleCountdown({ device }: ScheduleCountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (device.controlMode !== 'scheduled') return null;

  const status = getScheduleStatus(device);
  const boundary = getNextScheduleBoundary(device);
  if (!boundary) return null;

  const diffMs = new Date(boundary).getTime() - now;
  if (diffMs <= 0) return null;

  const totalMin = Math.ceil(diffMs / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  const display = h >= 24
    ? `${Math.floor(h / 24)}d ${h % 24}h`
    : h > 0 ? `${h}h ${m}m` : `${m}m`;
  const label = status === 'active' ? `Turns off in ${display}` : `Turns on in ${display}`;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium animate-fade-in">
      <Clock className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}
