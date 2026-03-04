

# Fix: Scheduled Mode Not Enforcing ON/OFF Times

## Problem
The current schedule logic (line 376) only turns a device OFF when it's a scheduled day AND past the end time. It fails to turn OFF when:
- It's not a scheduled day at all
- It's a scheduled day but before the start time
- The device was already ON when switching to scheduled mode outside the window

## Fix
In `src/hooks/useDevices.ts`, simplify the turn-off condition: if the device is in `scheduled` mode with an active schedule, and it's **not** inside the active window, turn it OFF. Replace the overly restrictive `!inWindow && device.isOn && isScheduledDay && currentMinutes >= endMinutes` with simply `!inWindow && device.isOn`.

### Change in `src/hooks/useDevices.ts` (line 376)
```typescript
// Before:
} else if (!inWindow && device.isOn && isScheduledDay && currentMinutes >= endMinutes) {

// After:
} else if (!inWindow && device.isOn) {
```

This ensures:
- Device turns ON only during the scheduled window
- Device turns OFF at any time outside the window (wrong day, before start, after end)
- Manual override still respected via `manualOverrideUntil`

Single line change in one file.

