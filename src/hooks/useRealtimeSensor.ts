import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, off, set, update, serverTimestamp } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import type { LiveData, SensorData, ActuatorState } from '../types';

const DEVICE_ID = 'greenflow-001';

export function useRealtimeSensor() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // SINKRONISASI JALUR: Mengikuti struktur database aktual dari main_2.cpp
    const liveRef = ref(rtdb, `live/${DEVICE_ID}`);
    const configRef = ref(rtdb, `config/${DEVICE_ID}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      setConnected(snap.val() === true);
    });

    const unsubscribeLive = onValue(liveRef, (snap) => {
      if (snap.exists()) {
        setLiveData(snap.val());
        setError(null);
      } else {
        setLiveData(null);
        setError('Device data not found');
      }
    }, (err) => {
      setError(err.message);
      console.error('RTDB Error:', err);
    });

    const unsubscribeConfig = onValue(configRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.val());
      } else {
        setConfig(null);
      }
    });

    listenerRef.current = () => {
      unsubscribeConnected();
      unsubscribeLive();
      unsubscribeConfig();
    };

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, []);

  const sendCommand = useCallback(async (command: Partial<ActuatorState>) => {
    try {
      const cmdRef = ref(rtdb, `commands/${DEVICE_ID}/${Date.now()}`);
      await set(cmdRef, {
        ...command,
        timestamp: serverTimestamp(),
        from: 'dashboard',
      });
    } catch (err) {
      console.error('Failed to send command:', err);
      throw err;
    }
  }, []);

  const calibratePump = useCallback(async (mlPerSecond: number) => {
    try {
      // SINKRONISASI JALUR: Mempertahankan format pumpCalibration/mlPerSecond sesuai spek dashboard
      const calibRef = ref(rtdb, `config/${DEVICE_ID}/pumpCalibration`);
      await update(calibRef, {
        mlPerSecond,
        lastCalibrated: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to calibrate pump:', err);
      throw err;
    }
  }, []);

  const updateConfig = useCallback(async (path: string, value: unknown) => {
    try {
      const configRef = ref(rtdb, `config/${DEVICE_ID}/${path}`);
      await set(configRef, value);
    } catch (err) {
      console.error('Failed to update config:', err);
      throw err;
    }
  }, []);

  const updateMultipleConfig = useCallback(async (configs: Record<string, unknown>) => {
    try {
      const configRef = ref(rtdb, `config/${DEVICE_ID}`);
      await update(configRef, configs);
    } catch (err) {
      console.error('Failed to update config:', err);
      throw err;
    }
  }, []);

  return {
    liveData,
    config,
    connected,
    error,
    sendCommand,
    calibratePump,
    updateConfig,
    updateMultipleConfig,
  };
}

export function useRealtimeHistory(hours = 24) {
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const historyRef = ref(rtdb, `history/${DEVICE_ID}`);
    
    const unsubscribe = onValue(historyRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const entries = Object.entries(data)
          .map(([, v]) => {
            const sensorItem = v as any;
            return {
              ...sensorItem,
              // FIX INVALID DATE: Memaksa konversi string dari ESP32 menjadi tipe data Number
              timestamp: sensorItem.timestamp ? Number(sensorItem.timestamp) : Date.now()
            };
          })
          // Proses filter dan sorting berjalan presisi menggunakan komparasi Number
          .filter((item) => item.timestamp > cutoff)
          .sort((a, b) => a.timestamp - b.timestamp);
          
        setHistory(entries);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => off(historyRef, 'value', unsubscribe);
  }, [hours]);

  return { history, loading };
}