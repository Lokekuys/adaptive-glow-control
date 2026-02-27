import {
  Power,
  Clock,
  Trash2,
  Hand,
  Calendar,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartPlug, AutomationSettings, ScheduleEntry, ControlMode } from "@/types/device";
import { Button } from "@/components/ui/button";
import { ScheduleEditor } from "./ScheduleEditor";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusIndicator } from "./StatusIndicator";
import { PowerIndicator } from "./PowerIndicator";
import { Badge } from "@/components/ui/badge";
import {
  OccupancyDisplay,
  LightLevelDisplay,
  PowerDisplay,
} from "./SensorDisplay";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getScheduleStatus, getScheduleLabel } from "@/lib/scheduleUtils";

interface DeviceDetailPanelProps {
  device: SmartPlug | null;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (deviceId: string) => void;
  onBrightnessChange: (deviceId: string, brightness: number) => void;
  onAutomationChange: (
    deviceId: string,
    settings: Partial<AutomationSettings>
  ) => void;
  onOverride: (deviceId: string, active: boolean, permanent: boolean) => void;
  onRemove: (deviceId: string) => void;
  onScheduleChange: (deviceId: string, schedule: ScheduleEntry) => void;
  onControlModeChange: (deviceId: string, mode: ControlMode) => void;
}

const CONTROL_MODES: { value: ControlMode; label: string; icon: typeof Hand; description: string }[] = [
  { value: 'manual', label: 'Manual', icon: Hand, description: 'Direct ON/OFF control' },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, description: 'Follow time schedule' },
  { value: 'smart', label: 'Smart', icon: Brain, description: 'Occupancy automation' },
];

export function DeviceDetailPanel({
  device,
  isOpen,
  onClose,
  onToggle,
  onBrightnessChange,
  onAutomationChange,
  onOverride,
  onRemove,
  onScheduleChange,
  onControlModeChange,
}: DeviceDetailPanelProps) {
  if (!device) return null;

  const sensorData = device.sensorData ?? { occupancy: "vacant", lightLevel: 0 };
  const powerData = device.powerData ?? { currentWatts: 0, todayKwh: 0, isAbnormal: false };
  const automationSettings = device.automationSettings ?? {
    occupancyControlEnabled: false,
    autoOffDelaySeconds: 300,
    adaptiveLightingEnabled: false,
  };
  const controlMode = device.controlMode ?? 'manual';

  const totalSeconds = automationSettings.autoOffDelaySeconds ?? 300;
  const autoOffHours = Math.floor(totalSeconds / 3600);
  const autoOffMinutes = Math.floor((totalSeconds % 3600) / 60);

  const scheduleStatus = getScheduleStatus(device);
  const scheduleLabel = getScheduleLabel(scheduleStatus);

  const handleTimeChange = (hours: number, minutes: number) => {
    const clampedHours = Math.max(0, Math.min(23, hours));
    const clampedMinutes = Math.max(0, Math.min(59, minutes));
    const totalSecs = clampedHours * 3600 + clampedMinutes * 60;
    onAutomationChange(device.id, { autoOffDelaySeconds: Math.max(60, totalSecs) });
  };

  const handleRemove = () => {
    onRemove(device.id);
    onClose();
  };

  // Schedule summary for display
  const schedule = device.override?.schedule;
  const scheduleSummary = schedule?.enabled && schedule.days?.length
    ? `${schedule.days.join(', ')} • ${schedule.startTime} – ${schedule.endTime}`
    : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl", device.isOn ? "bg-energy/10" : "bg-muted")}>
                <PowerIndicator isOn={device.isOn} size="lg" />
              </div>
              <div>
                <SheetTitle className="text-left">{device.name}</SheetTitle>
                <SheetDescription className="text-left">{device.location}</SheetDescription>
              </div>
            </div>
            <StatusIndicator status={device.isOnline ? "online" : "offline"} label={device.isOnline ? "Connected" : "Offline"} />
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Power Control */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
            <div className="flex items-center gap-3">
              <Power className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-base font-medium">Power</Label>
                <p className="text-sm text-muted-foreground">
                  {device.isOn ? "Device is on" : "Device is off"}
                </p>
              </div>
            </div>
            <Switch
              checked={device.isOn}
              onCheckedChange={() => onToggle(device.id)}
              disabled={!device.isOnline}
            />
          </div>

          <Separator />

          {/* Control Mode Selector */}
          <div className="space-y-3">
            <Label className="font-medium">Control Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {CONTROL_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = controlMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => onControlModeChange(device.id, mode.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{mode.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {CONTROL_MODES.find((m) => m.value === controlMode)?.description}
            </p>
          </div>

          {/* Schedule Status Badge (shown in scheduled mode) */}
          {controlMode === 'scheduled' && scheduleLabel && (
            <Badge variant="outline" className={cn(
              'text-xs w-fit',
              scheduleStatus === 'active' ? 'text-energy border-energy/30' : 'text-muted-foreground border-muted-foreground/30'
            )}>
              {scheduleLabel}
            </Badge>
          )}

          {/* Schedule Editor (shown in scheduled mode) */}
          {controlMode === 'scheduled' && (
            <div className="space-y-2">
              <ScheduleEditor
                schedule={device.override?.schedule}
                onChange={(schedule) => onScheduleChange(device.id, schedule)}
              />
              {scheduleSummary && (
                <p className="text-xs text-muted-foreground px-1">
                  📅 {scheduleSummary}
                </p>
              )}
            </div>
          )}

          {/* Smart Mode Settings (shown in smart mode) */}
          {controlMode === 'smart' && (
            <div className="space-y-4">
              <Label className="font-medium">Occupancy Automation</Label>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label>Auto-Off on Vacancy</Label>
                <Switch
                  checked={automationSettings.occupancyControlEnabled}
                  onCheckedChange={(checked) => onAutomationChange(device.id, { occupancyControlEnabled: checked })}
                />
              </div>

              {automationSettings.occupancyControlEnabled && (
                <div className="space-y-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Label>Auto-Off Delay</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={autoOffHours}
                        onChange={(e) => handleTimeChange(parseInt(e.target.value) || 0, autoOffMinutes)}
                        className="w-16 text-center font-mono"
                      />
                      <span className="text-sm text-muted-foreground">h</span>
                    </div>
                    <span className="text-muted-foreground font-bold">:</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={autoOffMinutes}
                        onChange={(e) => handleTimeChange(autoOffHours, parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-mono"
                      />
                      <span className="text-sm text-muted-foreground">m</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Device turns off after {autoOffHours > 0 ? `${autoOffHours}h ` : ""}{autoOffMinutes}m of vacancy
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Brightness - always shown, visually dimmed when off */}
          {device.classification?.pwmCompatible && (
            <>
              <Separator />
              <div className={cn("space-y-3 p-4 rounded-xl border", !device.isOn && "opacity-60")}>
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Brightness</Label>
                  <span className="text-sm font-mono text-muted-foreground">{device.brightness ?? 0}%</span>
                </div>
                <Slider
                  value={[device.brightness ?? 0]}
                  onValueChange={([value]) => onBrightnessChange(device.id, value)}
                  max={100}
                  min={0}
                  step={5}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Sensor Readings */}
          <div className="space-y-3">
            <OccupancyDisplay status={sensorData.occupancy} />
            <LightLevelDisplay lux={sensorData.lightLevel} />
            <PowerDisplay watts={device.isOn ? powerData.currentWatts : 0} isAbnormal={powerData.isAbnormal} />
          </div>

          <Separator />

          {/* Power Stats */}
          <div className="p-4 rounded-xl bg-muted">
            <Label className="text-sm">Today's Usage</Label>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{(powerData.todayKwh ?? 0).toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">kWh</span>
            </div>
          </div>

          <Separator />

          {/* Remove */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="w-4 h-4" />
                Remove Device
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Device</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove "{device.name}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}