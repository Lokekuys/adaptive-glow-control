

# Add Confirmation Dialog for Manual Toggle in Smart/Scheduled Mode

## What
When a user toggles a device OFF (or ON) while it's in **smart** or **scheduled** control mode, show a confirmation dialog warning them that they're overriding the automation. If in **manual** mode, toggle immediately with no dialog.

## Changes

### 1. DeviceCard.tsx — Add AlertDialog for toggle confirmation
- Add local state `showToggleWarning` (boolean)
- On switch toggle: if device is in `smart` or `scheduled` mode, set `showToggleWarning = true` instead of calling `onToggle` directly
- If in `manual` mode, call `onToggle` directly as before
- Render an `AlertDialog` with a message like:
  - Smart mode: *"This device is currently in Smart Mode. Turning it off manually will override the automation. Do you want to continue?"*
  - Scheduled mode: *"This device is currently in Scheduled Mode. Toggling it manually will override the schedule. Do you want to continue?"*
- On confirm: call `onToggle(device.id)` and close dialog
- On cancel: close dialog, no action

### 2. DeviceDetailPanel.tsx — Same logic for the toggle switch there
- Apply the same confirmation pattern to the toggle switch in the detail panel

## Files to modify
- `src/components/DeviceCard.tsx` — add AlertDialog state and render
- `src/components/DeviceDetailPanel.tsx` — same confirmation logic

