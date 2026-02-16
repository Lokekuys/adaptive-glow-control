

# Redesign Manual Scheduling: From Restriction to Automation

## Problem

The current scheduling system blocks user actions in several ways:
- Toggling OFF is blocked when a schedule is active (AlertDialog/toast warning)
- The entire configuration panel (brightness, sensors, automation, override, schedule) is hidden when the device is OFF
- This creates a confusing, restrictive experience

## Design Changes

### 1. Remove Toggle Blocking Logic
**Files: `DeviceCard.tsx`, `DeviceDetailPanel.tsx`**

- Remove the `if (device.isOn && override.active && schedule.enabled)` guard that prevents toggling OFF
- Remove the `AlertDialog` in `DeviceCard.tsx` for the schedule warning
- Allow the user to freely toggle ON/OFF at any time
- When manually toggling during an active schedule, set a `manualOverrideUntilNextBoundary` flag in Firebase so the scheduler knows to skip until the next schedule boundary

### 2. Show Configuration Panel Regardless of Device State
**File: `DeviceDetailPanel.tsx`**

- Remove the `{!device.isOn && <p>Turn the device on...</p>}` message
- Remove the `{device.isOn && ( ... )}` conditional wrapper around brightness, sensors, automation, override, and schedule sections
- Instead, show all sections always. Brightness slider can be visually dimmed (but still editable) when the device is OFF
- Sensor readings and power stats will show their current/last-known values even when OFF

### 3. Add "Outside Scheduled Hours" Indicator
**Files: `DeviceCard.tsx`, `DeviceDetailPanel.tsx`**

- Add a helper function `isWithinSchedule(schedule)` that checks if the current time/day falls within the scheduled window
- When a schedule is active but the current time is outside the window, show a subtle badge: "Outside scheduled hours" (info style, not blocking)
- When inside the window, show: "Scheduled - Active"

### 4. Update Schedule Logic to Respect Manual Override
**File: `useDevices.ts`**

- Add a new field `manualOverrideUntil` to the device override in Firebase
- When the user manually toggles a device during scheduled hours, set `manualOverrideUntil` to the next schedule boundary (start or end time)
- The schedule check interval (`checkSchedules`) will skip devices where `manualOverrideUntil` is in the future
- Once the boundary passes, clear the flag and resume normal schedule behavior

### 5. Update Type Definitions
**File: `types/device.ts`**

- Add `manualOverrideUntil?: string` (ISO timestamp) to the `DeviceOverride` interface

## Technical Details

### Modified Files

| File | Changes |
|------|---------|
| `src/types/device.ts` | Add `manualOverrideUntil?: string` to `DeviceOverride` |
| `src/hooks/useDevices.ts` | Update `toggleDevice` to set `manualOverrideUntil`; update `checkSchedules` to respect it and clear it at boundaries |
| `src/components/DeviceCard.tsx` | Remove AlertDialog schedule warning; add subtle schedule status badge |
| `src/components/DeviceDetailPanel.tsx` | Remove `isOn` gate on config panel; remove toggle block; add schedule status indicator; show all settings always |

### Schedule Status Helper (new utility)

```text
function getScheduleStatus(device):
  if no schedule or not enabled -> null
  if current day not in schedule.days -> "Outside scheduled days"
  if current time < startTime -> "Outside scheduled hours"  
  if current time >= endTime -> "Outside scheduled hours"
  else -> "Scheduled - Active"
```

### Manual Override Flow

```text
User toggles device during scheduled hours
  -> Device state changes immediately
  -> manualOverrideUntil = next schedule boundary timestamp
  -> Schedule checker skips this device until boundary
  -> At boundary, clears manualOverrideUntil and resumes schedule
```

### What Stays the Same
- Schedule editor UI and validation (start < end rule)
- Occupancy automation logic
- Override/automation mutual exclusivity toggle
- Auto-off timer with countdown
- Firebase data structure (minimal additions)

