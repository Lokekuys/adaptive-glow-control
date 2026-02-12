import { useState } from 'react';
import { Settings, ChevronRight, Wifi, WifiOff, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SmartPlug } from '@/types/device';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { StatusIndicator } from './StatusIndicator';
import { PowerIndicator } from './PowerIndicator';
import {
  OccupancyDisplay,
  LightLevelDisplay,
  PowerDisplay,
} from './SensorDisplay';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from './CountdownTimer';
import { ref, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

interface DeviceCardProps {
  device: SmartPlug;
  onToggle: (deviceId: string) => void;
  onSelect: (device: SmartPlug) => void;
  countdownEndsAt?: number;
}

export function DeviceCard({ device, onToggle, onSelect, countdownEndsAt }: DeviceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 🔹 Rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(device.name);

  // ✅ SAFETY NORMALIZATION (CRITICAL)
  const sensorData = device.sensorData ?? {
    occupancy: 'vacant',
    lightLevel: 0,
  };

  const powerData = device.powerData ?? {
    currentWatts: 0,
    isAbnormal: false,
  };

  const automationSettings = device.automationSettings ?? {
    occupancyControlEnabled: false,
  };

  const override = device.override ?? {
    active: false,
    permanent: false,
  };

  // 🔹 Rename handler
  const handleRename = async () => {
    if (!newName.trim() || newName === device.name) {
      setIsEditingName(false);
      setNewName(device.name);
      return;
    }

    await update(ref(rtdb, `devices/${device.id}`), {
      name: newName,
    });

    setIsEditingName(false);
  };

  return (
    <Card
      className={cn(
        'device-card cursor-pointer animate-fade-in',
        !device.isOnline && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(device)}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                device.isOn ? 'bg-energy/10' : 'bg-muted'
              )}
            >
              <PowerIndicator isOn={device.isOn} size="lg" />
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              {isEditingName ? (
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="border rounded px-2 py-1 text-sm w-full"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold text-foreground">
                    {device.name}
                  </h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {device.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {device.isOnline ? (
              <Wifi className="w-4 h-4 text-energy" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
            <StatusIndicator
              status={device.isOnline ? 'online' : 'offline'}
              label={device.isOnline ? 'Connected' : 'Offline'}
              size="sm"
              pulse={device.isOnline}
            />
          </div>
        </div>

        {/* Automation Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge
            className={cn(
              'automation-badge',
              automationSettings.occupancyControlEnabled
                ? 'active'
                : 'inactive'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                automationSettings.occupancyControlEnabled
                  ? 'bg-energy'
                  : 'bg-muted-foreground'
              )}
            />
            {automationSettings.occupancyControlEnabled ? 'Auto' : 'Manual'}
          </Badge>

          {override.active && (
            <Badge
              variant="outline"
              className="text-warning border-warning/30"
            >
              Override {override.permanent ? '(Permanent)' : '(Temp)'}
            </Badge>
          )}
        </div>

        {/* Sensor Readings */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <OccupancyDisplay status={sensorData.occupancy} compact />
          <LightLevelDisplay lux={sensorData.lightLevel} compact />
        </div>

        {/* Power Reading */}
        <PowerDisplay
          watts={device.isOn ? powerData.currentWatts : 0}
          isAbnormal={powerData.isAbnormal}
          compact
        />

        {/* Countdown Timer */}
        {countdownEndsAt && <div className="mt-2"><CountdownTimer endsAt={countdownEndsAt} /></div>}

        {/* Footer Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              checked={device.isOn}
              onCheckedChange={() => {
                if (device.isOn && device.override?.active && device.override?.schedule?.enabled) {
                  toast.warning("Manual scheduling is active. Please turn off the manual override first before switching off this device.");
                  return;
                }
                onToggle(device.id);
              }}
              disabled={!device.isOnline}
            />
            <span className="text-sm text-muted-foreground">
              {device.isOn ? 'On' : 'Off'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'transition-transform',
              isHovered && 'translate-x-1'
            )}
          >
            <Settings className="w-4 h-4 mr-1" />
            Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}