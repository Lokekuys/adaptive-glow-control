import { SmartPlug, DayOfWeek } from '@/types/device';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

export type ScheduleStatus = 'active' | 'outside-hours' | 'outside-days' | null;

export function getScheduleStatus(device: SmartPlug): ScheduleStatus {
  const schedule = device.override?.schedule;
  if (!schedule?.days?.length || !schedule?.startTime || !schedule?.endTime) return null;

  const now = new Date();
  const currentDay = DAY_MAP[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!schedule.days.includes(currentDay)) return 'outside-days';

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return 'active';
  return 'outside-hours';
}

export function getScheduleLabel(status: ScheduleStatus): string | null {
  switch (status) {
    case 'active': return 'Scheduled – Active';
    case 'outside-hours': return 'Outside scheduled hours';
    case 'outside-days': return 'Outside scheduled days';
    default: return null;
  }
}

/** Returns ISO string of the next schedule boundary (start or end) for today */
export function getNextScheduleBoundary(device: SmartPlug): string | null {
  const schedule = device.override?.schedule;
  if (!schedule?.startTime || !schedule?.endTime) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let targetMinutes: number;
  if (currentMinutes < startMinutes) {
    targetMinutes = startMinutes;
  } else if (currentMinutes < endMinutes) {
    targetMinutes = endMinutes;
  } else {
    // Past end time today — next boundary is start time tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(startH, startM, 0, 0);
    return tomorrow.toISOString();
  }

  const boundary = new Date(now);
  boundary.setHours(Math.floor(targetMinutes / 60), targetMinutes % 60, 0, 0);
  return boundary.toISOString();
}
