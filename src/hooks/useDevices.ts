import { ref, onValue, set, update } from "firebase/database";
import { rtdb } from "../lib/firebase";
import { useState, useCallback, useEffect } from "react";
import {
  SmartPlug,
  AutomationSettings,
  DailyUsage,
  SystemStatus,
  ApplianceType,
} from "@/types/device";

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

/* ---------- HOOK ---------- */

export function useDevices() {
  const [devices, setDevices] = useState<SmartPlug[] | null>(null);
  const [dailyUsage] = useState<DailyUsage[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    espNowConnected: true,
    wifiConnected: true,
    lastSync: new Date(),
    deviceCount: 0,
  });

  /* ---------- READ FROM FIREBASE ---------- */
  useEffect(() => {
    const devicesRef = ref(rtdb, "devices");

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const deviceList: SmartPlug[] = Object.values(data)
          .map((d: any) => ({
            ...d,

            sensorData: {
              occupancy: d.sensorData?.occupancy ?? "vacant",
              lightLevel: d.sensorData?.lightLevel ?? 0,
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

  /* ---------- WRITE TO FIREBASE ---------- */

  const toggleDevice = useCallback(
    (deviceId: string) => {
      const device = devices?.find((d) => d.id === deviceId);
      if (!device) return;

      update(ref(rtdb, `devices/${deviceId}`), {
        isOn: !device.isOn,
        lastSeen: new Date().toISOString(),
      });
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

  const refreshDevices = useCallback(() => {
    // placeholder for ESP-NOW sync
  }, []);

  return {
    devices,
    dailyUsage,
    systemStatus,
    toggleDevice,
    setBrightness,
    updateAutomation,
    setOverride,
    addDevice,
    removeDevice,
    refreshDevices,
  };
}
