

# Fix: Sensor Data Not Flowing to Devices

## Problem
The devices `onValue` listener on line 153 depends on `sharedSensorData` in its dependency array. This means:
1. On first render, `sharedSensorData` is `null` → devices load with fallback mock values
2. When the sensor listener fires and sets `sharedSensorData`, the devices `useEffect` **re-subscribes** — it unsubscribes and creates a new `onValue` listener, which causes a full re-fetch
3. This works in theory, but the closure-based approach is fragile and can miss updates if timing is off

## Fix
Instead of re-subscribing the devices listener every time sensor data changes, **decouple** them:

1. **Remove `sharedSensorData` from the devices `useEffect` dependency array**
2. **Use a `useRef` for shared sensor data** so the devices mapping always reads the latest value without triggering re-subscriptions
3. **Add a separate `useEffect` that re-merges sensor data into existing devices** when `sharedSensorData` changes — this updates `devices` state directly without re-subscribing to Firebase

### Changes in `src/hooks/useDevices.ts`

- Add `const sharedSensorRef = useRef(sharedSensorData)` and keep it synced
- In the devices `onValue` callback, read from `sharedSensorRef.current` instead of the stale closure
- Add a new `useEffect` watching `sharedSensorData` that updates the existing `devices` state in-place (re-maps sensor fields) — so when sensor data arrives or changes, devices update immediately without re-subscribing

This ensures:
- Devices listener subscribes **once**
- Sensor data is always the latest value when devices are mapped
- When sensor data changes independently, devices state is updated immediately

