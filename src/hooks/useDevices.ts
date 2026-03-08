import { ref, onValue, set, update, get } from "firebase/database";
import { rtdb } from "../lib/firebase";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  SmartPlug,
  AutomationSettings,
  ScheduleEntry,
  DailyUsage,
  SystemStatus,
  ApplianceType,
  ControlMode,
} from "@/types/device";
import { getScheduleStatus, getNextScheduleBoundary } from "@/lib/scheduleUtils";

/* ---------- MOCK DATA (SEED ONLY) ---------- */

const createMockDevice = (
  id: string,
  name: string,
  location: string,
  applianceType?: ApplianceType
): SmartPlug => {
  const type =
    applianceType ||
    (["resistive", "inductive", "switching"][
      Math.floor(Math.random() * 3)
    ] as ApplianceType);

  const pwmCompatible = type === "resistive";

  return {
    id,
    name,
    location,
    isOnline: true,
    isOn: false,
    brightness: pwmCompatible ? 50 : 100,
    controlMode: 'manual' as ControlMode,
    classification: {
      type,
      pwmCompatible,
      description: pwmCompatible
        ? "PWM dimming supported for resistive load"
        : `PWM disabled for ${type} load`,
    },
    sensorData: {
      occupancy: "vacant",
      lightLevel: 300,
      lastUpdated: new Date(),
    },
    powerData: {
      currentWatts: 0,
      voltage: 220,
      current: 0,
      todayKwh: 0,
      isAbnormal: false,
    },
    automationSettings: {
      occupancyControlEnabled: true,
      autoOffDelaySeconds: 300,
      adaptiveLightingEnabled: pwmCompatible,
      brightnessMin: 20,
      brightnessMax: 100,
      targetLux: 400,
    },
    override: {
      active: false,
      permanent: false,
    },
    lastSeen: new Date(),
  };
};

const mockDevices: SmartPlug[] = [
  createMockDevice("plug-001", "Living Room Light", "Living Room", "resistive"),
  createMockDevice("plug-002", "Bedroom Fan", "Bedroom", "inductive"),
];

/* ---------- MOCK POWER DATA ---------- */

const generateDailyData = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: days[date.getDay()],
      kwh: Math.round((Math.random() * 8 + 2) * 100) / 100,
      peakWatts: Math.round(Math.random() * 800 + 200),
    };
  });
};

const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  return months.slice(0, currentMonth + 1).map((month) => {
    const totalKwh = Math.round((Math.random() * 150 + 50) * 10) / 10;
    return {
      month,
      totalKwh,
      avgKwh: Math.round((totalKwh / 30) * 100) / 100,
    };
  });
};

/* ---------- HOOK ---------- */

export function useDevices() {
  const [devices, setDevices] = useState<SmartPlug[] | null>(null);
  const [vecoRate, setVecoRate] = useState<number>(12.79);
  const [dailyUsage] = useState<DailyUsage[]>([]);
  const [dailyPowerData] = useState(generateDailyData);
  const [monthlyPowerData] = useState(generateMonthlyData);
  const [sharedSensorData, setSharedSensorData] = useState<{ occupancy: string; lightLevel: number } | null>(null);
  const sharedSensorRef = useRef<{ occupancy: string; lightLevel: number } | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    espNowConnected: true,
    wifiConnected: true,
    lastSync: new Date(),
    deviceCount: 0,
  });

  // Read VECO rate from Firebase
  useEffect(() => {
    const rateRef = ref(rtdb, "settings/vecoRate");
    const unsubscribe = onValue(rateRef, (snapshot) => {
      if (snapshot.exists()) {
        setVecoRate(snapshot.val());
      } else {
        set(rateRef, 12.79);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to shared sensor box (OccupancyPlug/sensorBox)
  useEffect(() => {
    const sensorRef = ref(rtdb, "OccupancyPlug/sensorBox");
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = {
          occupancy: data.presence?.detected === true ? "occupied" : "vacant",
          lightLevel: data.lux ?? 0,
        };
        sharedSensorRef.current = parsed;
        setSharedSensorData(parsed);
      }
    });
    return () => unsubscribe();
  }, []);

  /* ---------- READ FROM FIREBASE ---------- */
  useEffect(() => {
    const devicesRef = ref(rtdb, "devices");

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const deviceList: SmartPlug[] = Object.values(data)
          .map((d: any) => ({
            ...d,
            controlMode: d.controlMode ?? 'manual',

            sensorData: {
              occupancy: sharedSensorRef.current?.occupancy ?? d.sensorData?.occupancy ?? "vacant",
              lightLevel: sharedSensorRef.current?.lightLevel ?? d.sensorData?.lightLevel ?? 0,
              lastUpdated: d.sensorData?.lastUpdated
                ? new Date(d.sensorData.lastUpdated)
                : new Date(),
            },

            powerData: {
              currentWatts: d.powerData?.currentWatts ?? 0,
              voltage: d.powerData?.voltage ?? 220,
              current: d.powerData?.current ?? 0,
              todayKwh: d.powerData?.todayKwh ?? 0,
              isAbnormal: d.powerData?.isAbnormal ?? false,
            },

            automationSettings: {
              occupancyControlEnabled:
                d.automationSettings?.occupancyControlEnabled ?? false,
              autoOffDelaySeconds:
                d.automationSettings?.autoOffDelaySeconds ?? 300,
              adaptiveLightingEnabled:
                d.automationSettings?.adaptiveLightingEnabled ?? false,
              brightnessMin: d.automationSettings?.brightnessMin ?? 20,
              brightnessMax: d.automationSettings?.brightnessMax ?? 100,
              targetLux: d.automationSettings?.targetLux ?? 400,
            },

            override: {
              active: d.override?.active ?? false,
              permanent: d.override?.permanent ?? false,
              ...(d.override?.manualOverrideUntil ? { manualOverrideUntil: d.override.manualOverrideUntil } : {}),
              ...(d.override?.schedule ? { schedule: d.override.schedule } : {}),
            },

            lastSeen: d.lastSeen ? new Date(d.lastSeen) : new Date(),
          }))
          // ✅ FILTER OUT INVALID / UNKNOWN DEVICES
          .filter(
            (d) =>
              d.id &&
              d.name &&
              d.location &&
              d.sensorData &&
              d.powerData &&
              d.automationSettings
          );

        setDevices(deviceList);
        setSystemStatus((prev) => ({
          ...prev,
          deviceCount: deviceList.length,
          lastSync: new Date(),
        }));
      } else {
        // Firebase loaded but empty
        setDevices([]);

        // Seed ONCE for demo purposes
        mockDevices.forEach((device) => {
          set(ref(rtdb, `devices/${device.id}`), device);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Re-merge sensor data into devices when sharedSensorData changes
  useEffect(() => {
    if (!sharedSensorData) return;
    setDevices((prev) => {
      if (!prev) return prev;
      return prev.map((d) => ({
        ...d,
        sensorData: {
          ...d.sensorData,
          occupancy: sharedSensorData.occupancy as any,
          lightLevel: sharedSensorData.lightLevel,
        },
      }));
    });
  }, [sharedSensorData]);

  /* ---------- AUTO-OFF TIMER LOGIC ---------- */
  const vacancyTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!devices) return;

    devices.forEach((device) => {
      const {
        id,
        isOn,
        sensorData,
        automationSettings: auto,
        controlMode,
      } = device;

      if (controlMode !== 'smart') {
        // Not in smart mode — cancel any pending timer
        if (vacancyTimers.current[id]) {
          clearTimeout(vacancyTimers.current[id]);
          delete vacancyTimers.current[id];
          setCountdowns((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
        return;
      }

      // Smart mode: auto-ON when occupied
      if (!isOn && sensorData.occupancy === "occupied") {
        update(ref(rtdb, `devices/${id}`), {
          isOn: true,
          lastSeen: new Date().toISOString(),
          turnedOnAt: new Date().toISOString(),
        });
      }

      // Smart mode: start auto-OFF countdown when vacant
      const shouldAutoOff =
        isOn &&
        auto.occupancyControlEnabled &&
        sensorData.occupancy === "vacant";

      if (shouldAutoOff && !vacancyTimers.current[id]) {
        const delayMs = (auto.autoOffDelaySeconds ?? 300) * 1000;
        const endsAt = Date.now() + delayMs;

        setCountdowns((prev) => ({ ...prev, [id]: endsAt }));

        vacancyTimers.current[id] = setTimeout(() => {
          update(ref(rtdb, `devices/${id}`), {
            isOn: false,
            lastSeen: new Date().toISOString(),
            turnedOnAt: null,
          });
          delete vacancyTimers.current[id];
          setCountdowns((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, delayMs);
      } else if (!shouldAutoOff && vacancyTimers.current[id]) {
        // Cancel timer (occupied again or turned off)
        clearTimeout(vacancyTimers.current[id]);
        delete vacancyTimers.current[id];
        setCountdowns((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  }, [devices]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(vacancyTimers.current).forEach(clearTimeout);
    };
  }, []);

  /* ---------- SCHEDULE-BASED AUTO ON/OFF ---------- */
  const DAY_MAP: Record<number, string> = {
    0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
  };

  useEffect(() => {
    if (!devices) return;

    const checkSchedules = () => {
      const now = new Date();
      const currentDay = DAY_MAP[now.getDay()];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      devices.forEach((device) => {
        const schedule = device.override?.schedule;
        if (!schedule?.enabled || !schedule.days?.length) return;
        if (device.controlMode !== 'scheduled') return;

        // Respect manual override until boundary
        const manualUntil = device.override?.manualOverrideUntil;
        if (manualUntil && new Date(manualUntil) > now) return;

        // Clear expired manualOverrideUntil
        if (manualUntil && new Date(manualUntil) <= now) {
          update(ref(rtdb, `devices/${device.id}/override`), {
            manualOverrideUntil: null,
          });
        }

        const isScheduledDay = schedule.days.includes(currentDay as any);
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        const inWindow = isScheduledDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;

        if (inWindow && !device.isOn) {
          update(ref(rtdb, `devices/${device.id}`), {
            isOn: true,
            lastSeen: new Date().toISOString(),
            turnedOnAt: new Date().toISOString(),
          });
        } else if (!inWindow && device.isOn) {
          update(ref(rtdb, `devices/${device.id}`), {
            isOn: false,
            lastSeen: new Date().toISOString(),
            turnedOnAt: null,
          });
        }
      });
    };

    checkSchedules();
    const interval = setInterval(checkSchedules, 30_000);
    return () => clearInterval(interval);
  }, [devices]);

  /* ---------- WRITE TO FIREBASE ---------- */

  const toggleDevice = useCallback(
    (deviceId: string) => {
      const device = devices?.find((d) => d.id === deviceId);
      if (!device) return;

      const newIsOn = !device.isOn;
      const updates: Record<string, any> = {
        isOn: newIsOn,
        lastSeen: new Date().toISOString(),
        turnedOnAt: newIsOn ? new Date().toISOString() : null,
      };

      // If in scheduled mode, switch to manual mode so the schedule doesn't fight back
      if (device.controlMode === 'scheduled') {
        updates.controlMode = 'manual';
      }

      update(ref(rtdb, `devices/${deviceId}`), updates);
    },
    [devices]
  );

  const setBrightness = useCallback(
    (deviceId: string, brightness: number) => {
      update(ref(rtdb, `devices/${deviceId}`), {
        brightness,
        lastSeen: new Date().toISOString(),
      });
    },
    []
  );

  const updateAutomation = useCallback(
    (deviceId: string, settings: Partial<AutomationSettings>) => {
      update(ref(rtdb, `devices/${deviceId}/automationSettings`), settings);
    },
    []
  );

  const setOverride = useCallback(
    (deviceId: string, active: boolean, permanent = false) => {
      update(ref(rtdb, `devices/${deviceId}/override`), {
        active,
        permanent,
      });
    },
    []
  );

  const addDevice = useCallback(
    (name: string, location: string, applianceType: ApplianceType) => {
      const id = `plug-${Date.now()}`;
      const newDevice = createMockDevice(id, name, location, applianceType);
      set(ref(rtdb, `devices/${id}`), newDevice);
    },
    []
  );

  const removeDevice = useCallback((deviceId: string) => {
    set(ref(rtdb, `devices/${deviceId}`), null);
  }, []);

  const updateSchedule = useCallback(
    (deviceId: string, schedule: ScheduleEntry) => {
      update(ref(rtdb, `devices/${deviceId}/override`), { schedule });
    },
    []
  );

  const updateVecoRate = useCallback((rate: number) => {
    set(ref(rtdb, "settings/vecoRate"), rate);
  }, []);

  const setControlMode = useCallback((deviceId: string, mode: ControlMode) => {
    update(ref(rtdb, `devices/${deviceId}`), {
      controlMode: mode,
      lastSeen: new Date().toISOString(),
    });
  }, []);

  const refreshDevices = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    devices,
    countdowns,
    dailyUsage,
    dailyPowerData,
    monthlyPowerData,
    vecoRate,
    systemStatus,
    toggleDevice,
    setBrightness,
    updateAutomation,
    setOverride,
    setControlMode,
    addDevice,
    removeDevice,
    updateSchedule,
    updateVecoRate,
    refreshDevices,
  };
}
