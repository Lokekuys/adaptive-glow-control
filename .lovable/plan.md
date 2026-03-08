

# Switch to Manual Mode on Scheduled Override

## What
When a user manually toggles a device that's in **scheduled** mode (after confirming the warning dialog), automatically switch the device's `controlMode` to `manual` instead of using the temporary `manualOverrideUntil` mechanism. This is simpler and avoids the schedule fighting back.

## Changes

### 1. `src/hooks/useDevices.ts` — `toggleDevice` function (~lines 396-419)
- When `device.controlMode === 'scheduled'`, instead of setting `manualOverrideUntil`, set `controlMode: 'manual'` in the update payload
- Remove the `manualOverrideUntil` logic for scheduled mode

### 2. `src/components/DeviceCard.tsx` — Update warning dialog text
- Change the scheduled mode confirmation message to inform the user that the device will be switched to manual mode (e.g., *"This device is currently in Scheduled Mode. Toggling it manually will switch it to Manual Mode. Do you want to continue?"*)

### 3. `src/components/DeviceDetailPanel.tsx` — Same dialog text update
- Mirror the updated message in the detail panel's confirmation dialog

