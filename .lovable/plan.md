

## Problem

Two issues:
1. **Panel uses `device.isOnline`** (static flag) on line 138 of `DeviceDetailPanel.tsx` instead of computing status from `lastSeen` — causing card/panel status mismatch.
2. **Controls are not disabled when offline** — users can toggle, change modes, and adjust brightness on unreachable devices.

## Plan

### 1. Fix DeviceDetailPanel status display (line 138)

Import `computeConnectionStatus`, `formatLastSeen`, and `STATUS_CONFIG` from `@/lib/deviceStatus`. Compute `connectionStatus` from `device.lastSeen` and replace the static `device.isOnline` check with the computed status. Add matching icons (Wifi/AlertTriangle/WifiOff) and "last seen" text — same rendering logic as `DeviceCard`.

### 2. Disable all controls when offline

Derive `const isOffline = connectionStatus === 'offline'` and apply `disabled={isOffline}` to:
- Power toggle switch (line 154–158) — already uses `!device.isOnline`, change to `isOffline`
- Control mode buttons (lines 171–184)
- Auto-off vacancy switch (line 210–212)
- Auto-off delay inputs (lines 223–256)
- Brightness slider (lines 275–281)
- Schedule editor (line 196)

### 3. Add offline overlay/banner

When `isOffline`, show a warning banner at the top of the panel content: "⚠ Device is offline — controls disabled" with muted styling.

### 4. Add toast on blocked actions (DeviceCard)

In `DeviceCard.tsx`, update `handleToggle` to check `connectionStatus` before proceeding. If offline, show a toast ("Cannot control device while offline") and return early. Import `toast` from `@/hooks/use-toast`.

### Files Changed
- **`src/components/DeviceDetailPanel.tsx`** — import heartbeat utils, compute status from `lastSeen`, replace `device.isOnline` references, disable all controls when offline, add offline banner
- **`src/components/DeviceCard.tsx`** — add offline guard with toast in `handleToggle`

