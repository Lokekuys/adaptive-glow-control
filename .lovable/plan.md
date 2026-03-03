

# Read Real Sensor Data from Firebase OccupancyPlug Collection

## Current State
- Sensor data (occupancy, lightLevel) is stored per-device under `devices/{id}/sensorData` with mock/default values
- No connection to real hardware sensor data

## What Changes

Since there is one shared sensor box, the app will listen to `OccupancyPlug/` in Firebase RTDB for real-time lux and occupancy values, and apply them to **all** devices.

### 1. Add a shared sensor listener in `useDevices.ts`
- Subscribe to `ref(rtdb, "OccupancyPlug")` with `onValue`
- Extract `lux` (or `lightLevel`) and `occupancy` fields from the snapshot
- Store in a `sharedSensorData` state: `{ occupancy, lightLevel }`
- When this data updates, write it back to each device's `sensorData` path in Firebase so the existing device model stays consistent
- Alternatively (cleaner): keep `sharedSensorData` as a separate state and merge it into each device object in-memory without writing back — the device cards and detail panel already read from `device.sensorData`

### 2. Merge shared sensor data into device objects
- In the `onValue` callback for devices, overlay the shared sensor values onto each device's `sensorData`
- This means all devices will show the same real occupancy and lux readings from the single sensor box

### 3. No UI changes needed
- `OccupancyDisplay`, `LightLevelDisplay`, `DeviceCard`, and `DeviceDetailPanel` already display `sensorData.occupancy` and `sensorData.lightLevel` — they will automatically show real data once the source changes

### 4. Smart mode auto-off uses real occupancy
- The existing auto-off timer logic in `useDevices.ts` already reads `sensorData.occupancy` — once real values flow in, smart mode will react to actual occupancy changes

### Technical Details

**Firebase path assumed:** `OccupancyPlug/lux` and `OccupancyPlug/occupancy` (flat structure). If the field names differ, they will be mapped accordingly.

**File changes:**
| File | Change |
|------|--------|
| `src/hooks/useDevices.ts` | Add `useEffect` subscribing to `OccupancyPlug` ref; merge real sensor data into each device's `sensorData` in the devices state |

This is a single-file change — the sensor display components and automation logic require no modifications.

