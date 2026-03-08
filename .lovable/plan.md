

# Improve Schedule UI in Scheduled Mode

## Current Issues
- The schedule editor is a plain bordered box with small, cramped elements
- The "Repeat Schedule" toggle is redundant when already in scheduled mode
- Day selector buttons are tiny and hard to tap on mobile
- Time inputs are small native `<input type="time">` fields
- Status badge and summary text are separate, disconnected elements
- No visual hierarchy or polished feel

## Changes

### 1. `src/components/ScheduleEditor.tsx` — Visual overhaul
- Remove the "Repeat Schedule" enable/disable toggle — when in scheduled mode, the schedule is always enabled (auto-set `enabled: true`)
- Make day selector buttons larger (circular, ~36px), with better active/inactive contrast
- Add quick-select buttons: "Weekdays" and "Every day"
- Style time inputs in a cleaner card layout with labeled "Start" / "End" sections and a visual arrow/divider between them
- Add a colored summary bar at the bottom showing the active schedule in a friendly format (e.g., "Mon–Fri, 8:00 AM – 6:00 PM")
- Use rounded cards (`rounded-xl`) and subtle background colors consistent with the design system

### 2. `src/components/DeviceDetailPanel.tsx` — Integrate status badge into schedule section
- Move the schedule status badge *inside* the schedule editor area (top-right corner) instead of being a separate floating element above it
- Remove the duplicate `scheduleSummary` text below the editor since the summary will now be built into the editor itself

### Files
- `src/components/ScheduleEditor.tsx` — redesign layout and styling
- `src/components/DeviceDetailPanel.tsx` — clean up schedule section (~lines 195-218)

