// Heartbeat-based device status computation

export type ConnectionStatus = 'connected' | 'idle' | 'offline';

const CONNECTED_THRESHOLD = 10_000;  // < 10s
const IDLE_THRESHOLD = 30_000;       // 10–30s

export function computeConnectionStatus(lastSeen: Date | string | number | undefined): ConnectionStatus {
  if (!lastSeen) return 'offline';

  const lastSeenMs = typeof lastSeen === 'number'
    ? lastSeen
    : new Date(lastSeen).getTime();

  if (isNaN(lastSeenMs)) return 'offline';

  const diff = Date.now() - lastSeenMs;

  if (diff < CONNECTED_THRESHOLD) return 'connected';
  if (diff < IDLE_THRESHOLD) return 'idle';
  return 'offline';
}

export function formatLastSeen(lastSeen: Date | string | number | undefined): string {
  if (!lastSeen) return 'Never';

  const lastSeenMs = typeof lastSeen === 'number'
    ? lastSeen
    : new Date(lastSeen).getTime();

  if (isNaN(lastSeenMs)) return 'Unknown';

  const diffSec = Math.floor((Date.now() - lastSeenMs) / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const STATUS_CONFIG: Record<ConnectionStatus, { label: string; indicatorStatus: 'online' | 'warning' | 'offline' }> = {
  connected: { label: 'Connected', indicatorStatus: 'online' },
  idle: { label: 'Unstable', indicatorStatus: 'warning' },
  offline: { label: 'Offline', indicatorStatus: 'offline' },
};
