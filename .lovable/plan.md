

# Firebase-Based Device Discovery for PWA

## Overview
Replace the current mock-based `AddDeviceDialog` with a Firebase Realtime Database listener that discovers unclaimed smart plugs and lets users claim them. Remove all mock device seeding. The sensor box is excluded since it writes to a different path.

## Architecture

```text
ESP32 Smart Plug boots → writes to /devices/{plugId} with isClaimed: false
                                    ↓
App listens to /devices → filters type=="smartPlug" && isClaimed==false
                                    ↓
User taps "Add Device" → sets isClaimed: true, isRegistered: true
                                    ↓
Device appears on dashboard (existing listener already reads /devices)
```

## Changes

### 1. Create `src/components/AddDeviceScanner.tsx`
New dialog/modal replacing `AddDeviceDialog`:
- Opens a full modal with "Searching for devices..." message and animation
- Subscribes to `/devices` via `onValue`, filters for `type === "smartPlug"` and `isClaimed === false`
- Displays each unclaimed plug as a card: name, device ID, status badge (online/offline)
- "Add Device" button per card calls `claimDevice(id)` which updates Firebase: `{ isClaimed: true, isRegistered: true }`
- On claim success, show toast and the device disappears from the scan list
- Close button to dismiss

### 2. Update `src/hooks/useDevices.ts`
- **Remove** `createMockDevice` function and `mockDevices` array
- **Remove** the seed-on-empty logic (the `else` block that writes mock devices)
- **Update** the `onValue` listener to only show devices where `isClaimed === true` (or `isRegistered === true`) on the dashboard
- **Update** `addDevice` to become `claimDevice(deviceId)` — sets `isClaimed: true, isRegistered: true` on an existing Firebase node instead of creating a new one
- **Remove** the old `addDevice` callback
- **Add** `toggleRelay` that writes to `/devices/{id}/relayState` (maps to existing `isOn` or new `relayState` field)
- Keep the existing `toggleDevice` but have it write `relayState` as well as `isOn` for ESP32 compatibility
- Mark device offline if `status !== "online"` or `lastSeen` is stale (>60s ago)

### 3. Update `src/types/device.ts`
Add fields to `SmartPlug`:
```typescript
type?: string;        // "smartPlug"
isClaimed?: boolean;
isRegistered?: boolean;
relayState?: boolean;
status?: string;      // "online" | "offline"
```

### 4. Update `src/pages/Index.tsx`
- Replace `<AddDeviceDialog>` with `<AddDeviceScanner>`
- Remove `addDevice` from destructured hook values, use new scanner component
- Dashboard continues showing only claimed devices (filtered in hook)

### 5. Update `src/components/DeviceCard.tsx`
- Use `relayState` alongside `isOn` for display (fallback: `device.relayState ?? device.isOn`)
- Show online/offline based on `device.status` or `device.isOnline`

### 6. Fix build errors
- **`src/index.css`**: Move the `@import url(...)` line to the very top, before `@tailwind` directives
- **Remove** any references to `@capacitor-community/wifi` and `pairingService.ts` (already gone in remix)

### 7. Delete unused files
- `src/components/AddDeviceDialog.tsx` — replaced by scanner

## Firebase Data Contract

The app expects ESP32 plugs to register at `/devices/{deviceId}` with at minimum:
```json
{
  "type": "smartPlug",
  "name": "ESP32 Smart Plug",
  "status": "online",
  "relayState": false,
  "isClaimed": false,
  "lastSeen": "2026-03-14T..."
}
```

The sensor box at `/OccupancyPlug/sensorBox` is untouched — existing listener remains.

