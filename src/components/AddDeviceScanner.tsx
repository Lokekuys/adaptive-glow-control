import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { Plus, Search, Wifi, WifiOff, Loader2, Plug, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ApplianceType } from '@/types/device';
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
  status: string;
  type: string;
}

type Step = 'scan' | 'configure';

export function AddDeviceScanner() {
  const [open, setOpen] = useState(false);
  const [unclaimed, setUnclaimed] = useState<UnclaimedDevice[]>([]);
  const [step, setStep] = useState<Step>('scan');
  const [selectedDevice, setSelectedDevice] = useState<UnclaimedDevice | null>(null);

  // Configuration fields
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('');
  const [applianceType, setApplianceType] = useState<ApplianceType>('resistive');
  const [claiming, setClaiming] = useState(false);

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
          list.push({
            id,
            name: d.name || id,
            status: d.status || 'unknown',
            type: d.type,
          });
        }
      }
      setUnclaimed(list);
    });

    return () => unsubscribe();
  }, [open]);

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
                Power on your smart plug to begin pairing. Available devices will appear below automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching for devices...
              </div>

              {unclaimed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <Plug className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No unclaimed devices found.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Make sure your smart plug is powered on and connected to WiFi.
                  </p>
                </div>
              ) : (
                unclaimed.map((device) => (
                  <Card key={device.id} className="border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                          <Plug className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{device.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{device.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={device.status === 'online' ? 'text-energy border-energy/30' : 'text-muted-foreground'}
                        >
                          {device.status === 'online' ? (
                            <><Wifi className="w-3 h-3 mr-1" /> Online</>
                          ) : (
                            <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
                          )}
                        </Badge>
                        <Button size="sm" onClick={() => handleSelectDevice(device)}>
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                <Badge
                  variant="outline"
                  className={selectedDevice?.status === 'online' ? 'text-energy border-energy/30' : 'text-muted-foreground'}
                >
                  {selectedDevice?.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
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
