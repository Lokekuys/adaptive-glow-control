import { useState } from 'react';
import { Plus, Plug } from 'lucide-react';
import { ApplianceType } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AddDeviceDialogProps {
  onAddDevice: (name: string, location: string, applianceType: ApplianceType) => void;
}

export function AddDeviceDialog({ onAddDevice }: AddDeviceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [applianceType, setApplianceType] = useState<ApplianceType>('resistive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && location.trim()) {
      onAddDevice(name.trim(), location.trim(), applianceType);
      setName('');
      setLocation('');
      setApplianceType('resistive');
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName('');
      setLocation('');
      setApplianceType('resistive');
    }
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="w-5 h-5 text-primary" />
              Add New Device
            </DialogTitle>
            <DialogDescription>
              Register a new smart plug to the system. The appliance type determines PWM compatibility.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                placeholder="e.g., Living Room Light"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Living Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Appliance Type</Label>
              <Select 
                value={applianceType} 
                onValueChange={(value: ApplianceType) => setApplianceType(value)}
              >
                <SelectTrigger id="type">
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !location.trim()}>
              Add Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
