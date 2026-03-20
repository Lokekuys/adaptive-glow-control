import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { Plus, Search, Wifi, WifiOff, AlertTriangle, Loader2, Plug, Check, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ApplianceType } from '@/types/device';
import { computeConnectionStatus, formatLastSeen, STATUS_CONFIG, type ConnectionStatus } from '@/lib/deviceStatus';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UnclaimedDevice {
  id: string;
  name: string;
  lastSeen: number | string | undefined;
  type: string;
}

type Step = 'scan' | 'configure';
type ScanState = 'idle' | 'scanning' | 'done';

const SCAN_DURATION = 6000; // 6 seconds

export function AddDeviceScanner() {
  const [open, setOpen] = useState(false);
  const [unclaimed, setUnclaimed] = useState<UnclaimedDevice[]>([]);
  const [step, setStep] = useState<Step>('scan');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [selectedDevice, setSelectedDevice] = useState<UnclaimedDevice | null>(null);
  const [, setTick] = useState(0);

  // Configuration fields
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('');
  const [applianceType, setApplianceType] = useState<ApplianceType>('resistive');
  const [claiming, setClaiming] = useState(false);

  // Tick every 5s to keep heartbeat status fresh
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [open]);

  // Listen to Firebase for unclaimed devices (only while dialog is open)
  useEffect(() => {
    if (!open) return;

    const devicesRef = ref(rtdb, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUnclaimed([]);
        return;
      }
      const data = snapshot.val();
      const list: UnclaimedDevice[] = [];
      for (const [id, val] of Object.entries(data)) {
        const d = val as any;
        if (d.type === 'smartPlug' && d.isClaimed !== true) {
          const ls = Number(d.lastSeen || 0);
          console.log('[AddDevice]', id, 'lastSeen:', ls, 'status:', computeConnectionStatus(ls));
          list.push({
            id,
            name: d.name || id,
            lastSeen: ls,
            type: d.type,
          });
        }
      }
      setUnclaimed(list);
    });

    return () => unsubscribe();
  }, [open]);

  const startScan = useCallback(() => {
    setScanState('scanning');
    setTimeout(() => {
      setScanState('done');
    }, SCAN_DURATION);
  }, []);

  // Filter: only show devices that are "connected" (lastSeen < 10s)
  const onlineDevices = unclaimed.filter(
    (d) => computeConnectionStatus(d.lastSeen) !== 'offline'
  );

  const getDeviceStatus = (device: UnclaimedDevice): ConnectionStatus => {
    return computeConnectionStatus(device.lastSeen);
  };

  const StatusIcon = ({ status }: { status: ConnectionStatus }) => {
    if (status === 'connected') return <Wifi className="w-3 h-3 mr-1" />;
    if (status === 'idle') return <AlertTriangle className="w-3 h-3 mr-1" />;
    return <WifiOff className="w-3 h-3 mr-1" />;
  };

  const statusBadgeClass = (status: ConnectionStatus) => {
    if (status === 'connected') return 'text-energy border-energy/30';
    if (status === 'idle') return 'text-warning border-warning/30';
    return 'text-muted-foreground border-muted-foreground/30';
  };

  const handleSelectDevice = (device: UnclaimedDevice) => {
    setSelectedDevice(device);
    setDeviceName(device.name);
    setLocation('');
    setApplianceType('resistive');
    setStep('configure');
  };

  const handleClaim = async () => {
    if (!selectedDevice || !deviceName.trim() || !location.trim()) return;

    setClaiming(true);
    const pwmCompatible = applianceType === 'resistive';

    try {
      await update(ref(rtdb, `devices/${selectedDevice.id}`), {
        isClaimed: true,
        isRegistered: true,
        name: deviceName.trim(),
        location: location.trim(),
        classification: {
          type: applianceType,
          pwmCompatible,
          description: pwmCompatible
            ? 'PWM dimming supported for resistive load'
            : `PWM disabled for ${applianceType} load`,
        },
        brightness: pwmCompatible ? 50 : 100,
      });
      toast({
        title: 'Device Added',
        description: `${deviceName.trim()} has been added to your dashboard.`,
      });
      handleReset();
      setOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to claim device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setScanState('idle');
    setSelectedDevice(null);
    setDeviceName('');
    setLocation('');
    setApplianceType('resistive');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === 'scan' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Add Device
              </DialogTitle>
              <DialogDescription>
                Power on your smart plug, then tap "Scan" to discover nearby devices.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Scan Button / Status */}
              {scanState === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Radio className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Make sure your smart plug is powered on and connected to WiFi before scanning.
                  </p>
                  <Button onClick={startScan} className="gap-2">
                    <Search className="w-4 h-4" />
                    Scan for Devices
                  </Button>
                </div>
              )}

              {scanState === 'scanning' && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Scanning for devices...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This will take a few seconds
                  </p>
                </div>
              )}

              {scanState === 'done' && (
                <>
                  {onlineDevices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                      <Plug className="w-10 h-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        No devices found nearby.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Make sure your smart plug is powered on and connected to WiFi.
                      </p>
                      <Button variant="outline" onClick={startScan} className="gap-2 mt-2">
                        <Search className="w-4 h-4" />
                        Scan Again
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          Found {onlineDevices.length} device{onlineDevices.length !== 1 ? 's' : ''}
                        </p>
                        <Button variant="ghost" size="sm" onClick={startScan} className="gap-1 text-xs">
                          <Search className="w-3 h-3" />
                          Rescan
                        </Button>
                      </div>

                      {onlineDevices.map((device) => {
                        const status = getDeviceStatus(device);
                        const config = STATUS_CONFIG[status];
                        return (
                          <Card key={device.id} className="border">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                                  <Plug className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-foreground">{device.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{device.id}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Last seen {formatLastSeen(device.lastSeen)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={statusBadgeClass(status)}>
                                  <StatusIcon status={status} />
                                  {config.label}
                                </Badge>
                                <Button size="sm" onClick={() => handleSelectDevice(device)}>
                                  Add
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plug className="w-5 h-5 text-primary" />
                Configure Device
              </DialogTitle>
              <DialogDescription>
                Set a name, location, and appliance type for your smart plug. The appliance type determines PWM compatibility.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Device ID badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedDevice?.id}
                </Badge>
                {selectedDevice && (() => {
                  const status = getDeviceStatus(selectedDevice);
                  const config = STATUS_CONFIG[status];
                  return (
                    <Badge variant="outline" className={statusBadgeClass(status)}>
                      <StatusIcon status={status} />
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., Living Room Light"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Living Room"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applianceType">Appliance Type</Label>
                <Select
                  value={applianceType}
                  onValueChange={(value: ApplianceType) => setApplianceType(value)}
                >
                  <SelectTrigger id="applianceType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resistive">
                      <div className="flex flex-col items-start">
                        <span>Resistive Load</span>
                        <span className="text-xs text-muted-foreground">Incandescent bulbs, heaters (PWM supported)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inductive">
                      <div className="flex flex-col items-start">
                        <span>Inductive Load</span>
                        <span className="text-xs text-muted-foreground">Motors, fans, compressors (No PWM)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="switching">
                      <div className="flex flex-col items-start">
                        <span>Switching Load</span>
                        <span className="text-xs text-muted-foreground">Electronics, TVs, chargers (No PWM)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {applianceType === 'resistive' ? (
                  <p className="text-xs text-energy">
                    ✓ PWM dimming will be enabled for this load type
                  </p>
                ) : (
                  <p className="text-xs text-warning">
                    ⚠ PWM dimming disabled for safety with this load type
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleClaim}
                disabled={claiming || !deviceName.trim() || !location.trim()}
                className="gap-2"
              >
                {claiming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Add Device
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
