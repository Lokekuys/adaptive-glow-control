import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { Plus, Search, Wifi, WifiOff, Loader2, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UnclaimedDevice {
  id: string;
  name: string;
  status: string;
  type: string;
}

export function AddDeviceScanner() {
  const [open, setOpen] = useState(false);
  const [unclaimed, setUnclaimed] = useState<UnclaimedDevice[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

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

  const claimDevice = async (deviceId: string) => {
    setClaiming(deviceId);
    try {
      await update(ref(rtdb, `devices/${deviceId}`), {
        isClaimed: true,
        isRegistered: true,
      });
      toast({
        title: 'Device Added',
        description: 'Smart plug has been added to your dashboard.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to claim device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
          {/* Scanning indicator */}
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
                    <Button
                      size="sm"
                      onClick={() => claimDevice(device.id)}
                      disabled={claiming === device.id}
                    >
                      {claiming === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
