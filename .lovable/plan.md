

## Problem

The ESP32 writes `lastSeen` as **UNIX seconds** (e.g., `1773906971`), but `computeConnectionStatus()` compares it directly against `Date.now()` which returns **milliseconds**. This produces a diff of ~1.7 trillion, making every device appear "offline".

## Plan

### 1. Fix `src/lib/deviceStatus.ts` — Detect seconds vs milliseconds

Update `computeConnectionStatus()` and `formatLastSeen()` to auto-detect whether `lastSeen` is in seconds or milliseconds. If the value is less than a reasonable threshold (e.g., `1e12`), multiply by 1000 to normalize to milliseconds. Also widen the connected threshold to 15 seconds to accommodate ESP32 heartbeat intervals.

```
- const CONNECTED_THRESHOLD = 10_000;
+ const CONNECTED_THRESHOLD = 15_000;  // < 15s (ESP sends every ~5-10s)
```

Add a helper to normalize timestamps:
```typescript
function normalizeToMs(ts: number): number {
  return ts < 1e12 ? ts * 1000 : ts;
}
```

Apply this normalization in both `computeConnectionStatus` and `formatLastSeen`.

### 2. Fix `src/components/AddDeviceScanner.tsx` — Show connected AND idle devices

Change the scan filter from `=== 'connected'` to `!== 'offline'` so both connected and idle devices appear in results.

Add a debug `console.log` in the Firebase listener for troubleshooting.

### Files Changed
- `src/lib/deviceStatus.ts` — normalize seconds→ms, widen connected threshold to 15s
- `src/components/AddDeviceScanner.tsx` — filter `!== 'offline'` instead of `=== 'connected'`

