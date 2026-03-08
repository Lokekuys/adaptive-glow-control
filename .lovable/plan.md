

# Fix: Update Presence Parsing for New Firebase Structure

## Problem
The current code reads `data.presence === true` (a simple boolean), but Firebase now stores `presence` as an object with `detected`, `distance_cm`, `motionlessDetected`, `movingDetected`, etc.

## Fix
In `src/hooks/useDevices.ts` line 145, change:
```typescript
// Before:
occupancy: data.presence === true ? "occupied" : "vacant",

// After:
occupancy: data.presence?.detected === true ? "occupied" : "vacant",
```

Single line change. No new UI displays needed — just read `presence.detected` instead of `presence` directly.

