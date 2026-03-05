

# Remove Cards & Replace Power Usage with Uptime Display

## Changes

### 1. Remove Total Power and Safety Mode summary cards (Index.tsx)
Remove the "Total Power" card and "Safety Mode" card from the summary grid. Keep "Occupied Zones" and "Auto-Controlled" cards, and adjust the grid to `grid-cols-2`.

### 2. Track device on-duration in Firebase (useDevices.ts + device.ts)
- Add `turnedOnAt?: string` (ISO timestamp) to the `SmartPlug` type
- When a device is toggled ON (or turned on by schedule/smart mode), write `turnedOnAt: new Date().toISOString()` to Firebase
- When toggled OFF, clear `turnedOnAt` to `null`

### 3. Replace PowerDisplay with uptime display on DeviceCard (DeviceCard.tsx)
- Remove the `<PowerDisplay>` component from the card
- Replace it with a new "On Duration" display that calculates elapsed time from `device.turnedOnAt` to now
- Show formatted duration (e.g., "2h 15m" or "45m 12s") using a simple interval-based timer
- Show "Off" when the device is not on

### 4. Create OnDurationDisplay component (SensorDisplay.tsx or new file)
- Accepts `turnedOnAt?: string` and `isOn: boolean`
- Uses `useState` + `setInterval` (every second) to update the displayed duration
- Styled consistently with existing sensor displays (icon + label + value)

## Files to modify
- `src/types/device.ts` — add `turnedOnAt` field
- `src/hooks/useDevices.ts` — set/clear `turnedOnAt` on toggle and automation actions
- `src/components/DeviceCard.tsx` — replace `PowerDisplay` with uptime display
- `src/components/SensorDisplay.tsx` — add `OnDurationDisplay` component
- `src/pages/Index.tsx` — remove Total Power and Safety Mode cards

