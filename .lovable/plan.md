

## Prevent device toggle-off while manual scheduling is active

When a user tries to turn off a device that has an active manual override with scheduling enabled, show a toast notification informing them to disable the manual schedule first, instead of toggling the device off.

### Changes

**1. `src/components/DeviceCard.tsx`**
- Import `toast` from sonner
- Update the `Switch` `onCheckedChange` handler: before calling `onToggle`, check if the device is currently ON, override is active, and schedule is enabled. If so, show a toast warning and return early instead of toggling.

**2. `src/components/DeviceDetailPanel.tsx`**
- Import `toast` from sonner
- Apply the same guard on the Power toggle `Switch`: if the user is trying to turn the device OFF while override is active and schedule is enabled, show a toast and block the action.

### Toast message
> "Manual scheduling is active. Please turn off the manual override first before switching off this device."

### Technical details
- The check will be: `device.isOn && device.override?.active && device.override?.schedule?.enabled`
- Only blocks turning OFF; turning ON is always allowed
- Uses the existing `sonner` toast library already installed in the project

