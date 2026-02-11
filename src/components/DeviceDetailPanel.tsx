import {
  Power,
  Sun,
  Clock,
  User,
  Settings2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartPlug, AutomationSettings } from "@/types/device";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusIndicator } from "./StatusIndicator";
import { PowerIndicator } from "./PowerIndicator";
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
}

export function DeviceDetailPanel({
  device,
  isOpen,
  onClose,
  onToggle,
  onBrightnessChange,
  onAutomationChange,
  onOverride,
  onRemove,
}: DeviceDetailPanelProps) {
  if (!device) return null;

  const sensorData = device.sensorData ?? {
    occupancy: "vacant",
    lightLevel: 0,
  };

  const powerData = device.powerData ?? {
    currentWatts: 0,
    todayKwh: 0,
    isAbnormal: false,
  };

  const automationSettings = device.automationSettings ?? {
    occupancyControlEnabled: false,
    autoOffDelaySeconds: 300,
    adaptiveLightingEnabled: false,
  };

  const override = device.override ?? {
    active: false,
    permanent: false,
  };

  const totalSeconds = automationSettings.autoOffDelaySeconds ?? 300;
  const autoOffHours = Math.floor(totalSeconds / 3600);
  const autoOffMinutes = Math.floor((totalSeconds % 3600) / 60);

  const handleTimeChange = (hours: number, minutes: number) => {
    const clampedHours = Math.max(0, Math.min(23, hours));
    const clampedMinutes = Math.max(0, Math.min(59, minutes));
    const totalSecs = clampedHours * 3600 + clampedMinutes * 60;
    // Minimum 1 minute
    onAutomationChange(device.id, {
      autoOffDelaySeconds: Math.max(60, totalSecs),
    });
  };

  const handleRemove = () => {
    onRemove(device.id);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl",
                  device.isOn ? "bg-energy/10" : "bg-muted"
                )}
              >
                <PowerIndicator isOn={device.isOn} size="lg" />
              </div>
              <div>
                <SheetTitle className="text-left">{device.name}</SheetTitle>
                <SheetDescription className="text-left">
                  {device.location}
                </SheetDescription>
              </div>
            </div>
            <StatusIndicator
              status={device.isOnline ? "online" : "offline"}
              label={device.isOnline ? "Online" : "Offline"}
            />
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

          {/* OFF MESSAGE */}
          {!device.isOn && (
            <p className="text-sm text-muted-foreground text-center">
              Turn the device on to view brightness, sensors, and automation
              settings.
            </p>
          )}

          {/* EVERYTHING BELOW ONLY SHOWS WHEN ON */}
          {device.isOn && (
            <>
              {/* Brightness */}
              {device.classification?.pwmCompatible && (
                <div className="space-y-3 p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Brightness</Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {device.brightness ?? 0}%
                    </span>
                  </div>
                  <Slider
                    value={[device.brightness ?? 0]}
                    onValueChange={([value]) =>
                      onBrightnessChange(device.id, value)
                    }
                    max={100}
                    min={0}
                    step={5}
                  />
                </div>
              )}

              <Separator />

              {/* Sensor Readings */}
              <div className="space-y-3">
                <OccupancyDisplay status={sensorData.occupancy} />
                <LightLevelDisplay lux={sensorData.lightLevel} />
                <PowerDisplay
                  watts={powerData.currentWatts}
                  isAbnormal={powerData.isAbnormal}
                />
              </div>

              <Separator />

              {/* Automation */}
              <div className="space-y-4">
                <Label className="font-medium">Automation</Label>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <Label>Occupancy Control</Label>
                  <Switch
                    checked={automationSettings.occupancyControlEnabled}
                    onCheckedChange={(checked) =>
                      onAutomationChange(device.id, {
                        occupancyControlEnabled: checked,
                      })
                    }
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
                          onChange={(e) =>
                            handleTimeChange(parseInt(e.target.value) || 0, autoOffMinutes)
                          }
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
                          onChange={(e) =>
                            handleTimeChange(autoOffHours, parseInt(e.target.value) || 0)
                          }
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

              <Separator />

             {/* Override */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label className="font-medium">Manual Override</Label>
                <Switch
                   checked={override.active}
                    onCheckedChange={(checked) =>
                      onOverride(device.id, checked, override.permanent)
                    }
                />
              </div>

              <Separator />

              {/* Power Stats */}
              <div className="p-4 rounded-xl bg-muted">
                <Label className="text-sm">Today's Usage</Label>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">
                    {powerData.todayKwh.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">kWh</span>
                </div>
              </div>
            </>
          )}

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
                  Are you sure you want to remove “{device.name}”?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
