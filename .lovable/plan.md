

# Add Weekends Quick-Select & Time Picker Dialog

## Changes

### `src/components/ScheduleEditor.tsx`

**1. Add "Weekends" quick-select button**
- Add `WEEKENDS` constant: `['Sat', 'Sun']`
- Add `selectWeekends` function and `isWeekendsSelected` check
- Add a third quick-select button "Weekends" alongside "Weekdays" and "Every day"
- Update `condenseDays` to detect weekends pattern and return "Weekends"

**2. Replace inline time inputs with tappable time display that opens a dialog**
- Remove the native `<input type="time">` fields from the inline card
- Instead, show the current start/end times as large, tappable text buttons (e.g., "8:00 AM → 6:00 PM")
- Clicking either time opens a `Dialog` with two `<input type="time">` fields (larger, easier to use) plus the existing confirmation flow
- The dialog has "Cancel" and "Save" buttons; "Save" triggers the confirmation alert dialog
- This solves the tiny clock icon problem by making the time display a large tap target

### Files
- `src/components/ScheduleEditor.tsx` — all changes in this single file

