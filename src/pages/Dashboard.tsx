import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn, formatNumber, formatTime, calculateVPD, voltageToPercent } from '../lib/utils';
import { SensorReading } from '../types/sensor';
import { useRealtimeSensor, useRealtimeHistory } from '../hooks/useRealtimeSensor';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  Wifi, Cpu, Zap, Fan, Droplet, Thermometer, Activity, 
  Lock, Unlock, Battery, ArrowRight, Sun, Layers,
  Bot, ToggleLeft, ClipboardList, Sliders, Timer
} from 'lucide-react';

const dummyData: SensorReading = {
  temperature: 28.6,
  humidity: 78.7,
  vpd: 0.83,
  soilMoistureA: 80,
  soilMoistureB: 82,
  ph: 6.1,
  ec: 1.4,
  waterLevel: 75,
  batteryVoltage: 12.6,
  batteryPercent: 85,
  rssi: -62,
  uptime: 345600,
  timestamp: Date.now(),
};

interface ScheduleItem {
  id: string;
  hst_mulai: number;
  hst_selesai: number;
  target_ml: number;
  waktu_siram: string[];
}

const defaultSchedules: ScheduleItem[] = [
  { id: '1', hst_mulai: 1, hst_selesai: 10, target_ml: 150, waktu_siram: ['06:00', '12:00', '18:00'] },
  { id: '2', hst_mulai: 11, hst_selesai: 25, target_ml: 200, waktu_siram: ['06:00', '10:00', '14:00', '18:00'] },
  { id: '3', hst_mulai: 26, hst_selesai: 45, target_ml: 250, waktu_siram: ['06:00', '09:00', '12:00', '15:00', '18:00'] },
  { id: '4', hst_mulai: 46, hst_selesai: 70, target_ml: 300, waktu_siram: ['06:00', '12:00', '18:00'] },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-soft">
        <p className="text-xs text-surface-500 dark:text-surface-440 font-medium mb-1.5 border-b border-surface-100 dark:border-surface-800 pb-1">
          {new Date(label).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pld.color }} />
              <span className="text-surface-600 dark:text-surface-400 text-xs">{pld.name}:</span>
              <span className="font-semibold text-surface-900 dark:text-surface-50 ml-auto">
                {formatNumber(pld.value, pld.name.toLowerCase().includes('ph') || pld.name.toLowerCase().includes('ec') ? 2 : 1)}
                <span className="text-[10px] font-normal text-surface-500 ml-0.5">{pld.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function DashboardGauge({ 
  value, 
  min = 0, 
  max = 100, 
  label, 
  unit, 
  color, 
  status, 
  icon: Icon,
  extraInfo
}: { 
  value: number; 
  min?: number; 
  max?: number; 
  label: string; 
  unit: string; 
  color: 'orange' | 'emerald' | 'blue' | 'yellow'; 
  status: string; 
  icon: any;
  extraInfo?: React.ReactNode;
}) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const totalLength = 141.37;
  const strokeDashoffset = totalLength - (totalLength * percentage) / 100;
  
  const strokeColorMap = {
    orange: 'stroke-orange-500 dark:stroke-orange-400 text-orange-500 dark:text-orange-400',
    emerald: 'stroke-emerald-500 dark:stroke-emerald-400 text-emerald-500 dark:text-emerald-400',
    blue: 'stroke-blue-500 dark:stroke-blue-400 text-blue-500 dark:text-blue-400',
    yellow: 'stroke-yellow-500 dark:stroke-yellow-400 text-yellow-500 dark:text-yellow-400',
  };

  const statusBgMap = {
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40 text-orange-600 dark:text-orange-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/40 text-yellow-600 dark:text-yellow-400',
  };

  // Logika penentu teks label kecil di bawah angka agar dinamis dan tidak "Suhu Aktual" semua
  const subLabel = label.toLowerCase().includes('lingkungan') ? 'SUHU AKTUAL' 
                 : label.toLowerCase().includes('tanah') ? 'RATA-RATA' 
                 : 'TEGANGAN AKI';

  return (
    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft hover:shadow-md hover:border-primary-500/20 dark:hover:border-primary-55/20 transition-all duration-300 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase tracking-wider flex items-center gap-1.5">
          <Icon className="w-4 h-4" />
          {label}
        </span>
        <span className={cn('text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wide', statusBgMap[color])}>
          {status}
        </span>
      </div>
      
      {/* Box Viewport Setengah Lingkaran Sempurna */}
      <div className="relative h-20 flex items-end justify-center overflow-hidden mb-4">
        <svg className="w-28 h-14" viewBox="0 0 100 50">
          <path
            d="M 5,50 A 45,45 0 0,1 95,50"
            fill="transparent"
            className="stroke-surface-100 dark:stroke-surface-800"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 5,50 A 45,45 0 0,1 95,50"
            fill="transparent"
            className={cn('transition-all duration-1000 ease-out', strokeColorMap[color])}
            strokeWidth="8"
            strokeDasharray={totalLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* FIX: Menggeser posisi y turun ke bawah agar pas di tengah arch dan tidak menabrak teks statis */}
        <div className="absolute text-center translate-y-[14px]">
          <span className="text-2xl font-black text-surface-900 dark:text-surface-50 tracking-tight">
            {formatNumber(value)}
            <span className="text-xs font-normal text-surface-400 ml-0.5">{unit}</span>
          </span>
          {/* FIX: Menggunakan subLabel dinamis agar teks rapi sesuai jenis kotak */}
          <span className="block text-[8px] text-surface-400 dark:text-surface-500 font-bold uppercase tracking-widest mt-0.5">{subLabel}</span>
        </div>
      </div>

      {extraInfo && (
        <div className="border-t border-surface-100 dark:border-surface-850 pt-3 mt-1 space-y-1.5 text-xs text-surface-500 dark:text-surface-400 font-medium">
          {extraInfo}
        </div>
      )}
    </div>
  );
}
export function DashboardPage() {
  const { liveData: rtdbLiveData, config, sendCommand } = useRealtimeSensor();
  const { history: rtdbHistory } = useRealtimeHistory(24);

  const [simulatedLiveData, setSimulatedLiveData] = useState<SensorReading>(dummyData);
  const [simulatedPumpOn, setSimulatedPumpOn] = useState(false);
  const [simulatedFanOn, setSimulatedFanOn] = useState(true);
  const [simulatedMode, setSimulatedMode] = useState<'auto' | 'manual' | 'schedule'>('schedule');

  const [chartMetric, setChartMetric] = useState<'climate' | 'vpd' | 'soil'>('climate');

  useEffect(() => {
    const vpd = calculateVPD(simulatedLiveData.temperature, simulatedLiveData.humidity);
    const batteryPercent = voltageToPercent(simulatedLiveData.batteryVoltage);
    setSimulatedLiveData(prev => ({ ...prev, vpd, batteryPercent }));
  }, [simulatedLiveData.temperature, simulatedLiveData.humidity, simulatedLiveData.batteryVoltage]);

  const hasRealData = rtdbLiveData !== null;

  const liveData: SensorReading = useMemo(() => {
    if (hasRealData && rtdbLiveData) {
      const s = rtdbLiveData.sensors || {};
      const t = s.temperature !== undefined ? s.temperature : simulatedLiveData.temperature;
      const h = s.humidity !== undefined ? s.humidity : simulatedLiveData.humidity;
      
      return {
        temperature: t,
        humidity: h,
        vpd: s.vpd || calculateVPD(t, h),
        soilMoistureA: s.soilMoistureA !== undefined ? s.soilMoistureA : simulatedLiveData.soilMoistureA,
        soilMoistureB: s.soilMoistureB !== undefined ? s.soilMoistureB : simulatedLiveData.soilMoistureB,
        ph: s.ph !== undefined ? s.ph : simulatedLiveData.ph,
        ec: s.ec !== undefined ? s.ec : simulatedLiveData.ec,
        waterLevel: s.waterLevel !== undefined ? s.waterLevel : simulatedLiveData.waterLevel,
        batteryVoltage: s.batteryVoltage !== undefined ? s.batteryVoltage : simulatedLiveData.batteryVoltage,
        batteryPercent: s.batteryPercentage || voltageToPercent(s.batteryVoltage || simulatedLiveData.batteryVoltage),
        rssi: s.rssi !== undefined ? s.rssi : simulatedLiveData.rssi,
        uptime: rtdbLiveData.status?.uptime || 0,
        timestamp: s.timestamp || Date.now(),
      };
    }
    return simulatedLiveData;
  }, [rtdbLiveData, simulatedLiveData, hasRealData]);

  const history: SensorReading[] = useMemo(() => {
    if (hasRealData && rtdbHistory && rtdbHistory.length > 0) {
      const mapped = rtdbHistory.map((d: any) => {
        const t = d.temperature !== undefined ? d.temperature : simulatedLiveData.temperature;
        const h = d.humidity !== undefined ? d.humidity : simulatedLiveData.humidity;
        return {
          temperature: t,
          humidity: h,
          vpd: d.vpd || calculateVPD(t, h),
          soilMoistureA: d.soilMoistureA !== undefined ? d.soilMoistureA : simulatedLiveData.soilMoistureA,
          soilMoistureB: d.soilMoistureB !== undefined ? d.soilMoistureB : simulatedLiveData.soilMoistureB,
          ph: d.ph !== undefined ? d.ph : simulatedLiveData.ph,
          ec: d.ec !== undefined ? d.ec : simulatedLiveData.ec,
          waterLevel: d.waterLevel !== undefined ? d.waterLevel : simulatedLiveData.waterLevel,
          batteryVoltage: d.batteryVoltage !== undefined ? d.batteryVoltage : simulatedLiveData.batteryVoltage,
          batteryPercent: d.batteryPercentage || voltageToPercent(d.batteryVoltage || simulatedLiveData.batteryVoltage),
          rssi: d.rssi !== undefined ? d.rssi : simulatedLiveData.rssi,
          uptime: d.uptime || 0,
          timestamp: d.timestamp,
        };
      });
      return mapped.slice(-7);
    }
    return [];
  }, [rtdbHistory, hasRealData, simulatedLiveData]);

  const activeMode = simulatedMode || (hasRealData && rtdbLiveData?.actuators?.mode ? rtdbLiveData.actuators.mode : 'schedule');
  const pumpOn = hasRealData && rtdbLiveData?.actuators?.pump !== undefined ? rtdbLiveData.actuators.pump : simulatedPumpOn;
  const fanOn = hasRealData && rtdbLiveData?.actuators?.fan !== undefined ? rtdbLiveData.actuators.fan : simulatedFanOn;

  const handleModeChange = useCallback(async (newMode: 'auto' | 'manual' | 'schedule') => {
    setSimulatedMode(newMode); 
    try {
      if (sendCommand) {
        await sendCommand({ mode: newMode });
      }
    } catch (err) {
      console.error("Firebase send failed:", err);
    }
  }, [sendCommand]);

  const togglePump = useCallback(async () => {
    if (activeMode !== 'manual') return; 
    setSimulatedPumpOn(p => !p);
    try {
      await sendCommand({ pump: !pumpOn });
    } catch (err) {
      console.error(err);
    }
  }, [activeMode, pumpOn, sendCommand]);

  const toggleFan = useCallback(async () => {
    if (activeMode !== 'manual') return; 
    setSimulatedFanOn(f => !f);
    try {
      await sendCommand({ fan: !fanOn });
    } catch (err) {
      console.error(err);
    }
  }, [activeMode, fanOn, sendCommand]);

  const wifiSSID = hasRealData && (rtdbLiveData?.sensors as any)?.wifi_ssid ? (rtdbLiveData.sensors as any).wifi_ssid : 'GREENFLOW-IOT';
  const wifiRSSI = liveData.rssi;
  const ipAddress = hasRealData && (rtdbLiveData?.sensors as any)?.wifi_ip ? (rtdbLiveData.sensors as any).wifi_ip : '192.168.1.105';

  const isOnline = useMemo(() => {
    if (!hasRealData) return false;
    const minutesSinceSync = (Date.now() - liveData.timestamp) / 60000;
    return minutesSinceSync < 5;
  }, [liveData.timestamp, hasRealData]);

const plantingDateStr = config?.plantingDate || '2026-05-20';

const hstSekarang = useMemo(() => {
  if (!plantingDateStr) return 0;

  // Samakan tumpuan ke 00:00:00 waktu lokal
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(plantingDateStr);
  // Tangani parsing YYYY-MM-DD agar dianggap jam 00:00 waktu lokal
  const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  const diffInMs = now.getTime() - startLocal.getTime();
  const diffInDays = Math.floor(diffInMs / (24 * 3600 * 1000));

  // Jika belum tanam (diff < 0), return 0. Jika sudah tanam, H-1 tanam = 1 HST.
  return diffInDays < 0 ? 0 : diffInDays + 1;
}, [plantingDateStr]);

  const targetSiram = useMemo(() => {
    if (config?.schedules && Array.isArray(config.schedules)) {
      const match = config.schedules.find((s: any) => s.hst_mulai <= hstSekarang && s.hst_selesai >= hstSekarang);
      if (match) return match.target_ml;
    }
    return 250;
  }, [config?.schedules, hstSekarang]);

  const calculateNextWatering = useCallback((times: string[]): string => {
    if (!times || times.length === 0) return '--:--';
    const sortedTimes = [...times].sort();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const time of sortedTimes) {
      const parts = time.split(':');
      if (parts.length >= 2) {
        const timeMinutes = Number(parts[0]) * 60 + Number(parts[1]);
        if (timeMinutes > currentMinutes) {
          return time;
        }
      }
    }
    return `${sortedTimes[0]} (Besok)`;
  }, []);

  const jadwalSelanjutnya = useMemo(() => {
    if (config?.schedules && Array.isArray(config.schedules)) {
      const match = config.schedules.find((s: any) => s.hst_mulai <= hstSekarang && s.hst_selesai >= hstSekarang);
      if (match && Array.isArray(match.waktu_siram)) {
        return calculateNextWatering(match.waktu_siram);
      }
    } else {
      const activeSched = defaultSchedules.find(s => s.hst_mulai <= hstSekarang && s.hst_selesai >= hstSekarang);
      if (activeSched && Array.isArray(activeSched.waktu_siram)) {
        return calculateNextWatering(activeSched.waktu_siram);
      }
    }
    return '--:--';
  }, [config?.schedules, hstSekarang, calculateNextWatering]);

  const penyiramanTerakhir = hasRealData && (rtdbLiveData?.status as any)?.jam_terakhir_siram ? (rtdbLiveData.status as any).jam_terakhir_siram : '--:--';
  const penyiramanKe = hasRealData && (rtdbLiveData?.status as any)?.penyiraman_ke !== undefined ? (rtdbLiveData.status as any).penyiraman_ke : 0;

  const avgSoil = Math.round((liveData.soilMoistureA + liveData.soilMoistureB) / 2);

  const maxAki = 12.8;
  const minAki = 11.9;

  const sourceDaya = useMemo(() => {
    if (liveData.batteryVoltage > 12.5) return 'plts';
    if (liveData.batteryVoltage > 11.5) return 'baterai';
    return 'pln';
  }, [liveData.batteryVoltage]);

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-surface-900 dark:text-surface-100">
      
      {/* Premium Glassmorphic Header */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-xs text-surface-500 dark:text-surface-440 mt-0.5 font-medium">Sistem Otomatisasi Greenhouse Melon Hybrid</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-440">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ESP32 ONLINE
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-440">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              ESP32 OFFLINE
            </div>
          )}

          <div className="px-4 py-1.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 text-surface-600 dark:text-surface-300 flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-primary-500" />
            <span>SSID: <span className="font-bold text-surface-900 dark:text-surface-50">{wifiSSID}</span></span>
            <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
            <span className="text-emerald-600 dark:text-emerald-455 font-bold">{wifiRSSI} dBm</span>
          </div>

          <div className="px-4 py-1.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 text-surface-600 dark:text-surface-300">
            Node IP: <span className="text-primary-600 dark:text-primary-455 font-mono">{ipAddress}</span>
          </div>
        </div>
      </div>

      {/* Mode & Kendali Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mode Selector */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            1. Mode Operasi Sistem Utama
          </h3>
          <div className="grid grid-cols-3 gap-2 bg-surface-50 dark:bg-surface-950 p-1.5 rounded-2xl border border-surface-150 dark:border-surface-850">
            <button 
              onClick={() => handleModeChange('auto')}
              className={cn(
                'py-2 rounded-xl text-xs tracking-wide transition-all duration-350 font-bold flex items-center justify-center gap-1.5',
                activeMode === 'auto' 
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200 dark:border-surface-800' 
                  : 'text-surface-500 hover:text-surface-800 dark:text-surface-440 dark:hover:text-surface-200'
              )}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              Otomatis
            </button>
            <button 
              onClick={() => handleModeChange('schedule')}
              className={cn(
                'py-2 rounded-xl text-xs tracking-wide transition-all duration-350 font-bold flex items-center justify-center gap-1.5',
                activeMode === 'schedule' 
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200 dark:border-surface-800' 
                  : 'text-surface-500 hover:text-surface-800 dark:text-surface-440 dark:hover:text-surface-200'
              )}
            >
              <Timer className="w-3.5 h-3.5 shrink-0" />
              Terjadwal
            </button>
            <button 
              onClick={() => handleModeChange('manual')}
              className={cn(
                'py-2 rounded-xl text-xs tracking-wide transition-all duration-350 font-bold flex items-center justify-center gap-1.5',
                activeMode === 'manual' 
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200 dark:border-surface-800' 
                  : 'text-surface-500 hover:text-surface-800 dark:text-surface-440 dark:hover:text-surface-200'
              )}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              Manual
            </button>
          </div>
        </div>

        {/* Actuator Toggles */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-surface-500 dark:text-surface-455 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-primary-500" />
              2. Kendali Aktuator
            </span>
            {activeMode !== 'manual' ? (
              <span className="text-[10px] text-rose-600 dark:text-rose-455 font-bold uppercase flex items-center gap-1">
                <Lock className="w-3 h-3" /> Terkunci (Auto)
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-455 font-bold uppercase flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Siap
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={toggleFan}
              disabled={activeMode !== 'manual'}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300',
                fanOn && activeMode === 'manual'
                  ? 'border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/20 text-orange-600 dark:text-orange-450' 
                  : 'border-surface-150 dark:border-surface-850 bg-surface-50 dark:bg-surface-950 text-surface-500 dark:text-surface-440 disabled:opacity-40'
              )}
            >
              <span className="text-xs font-bold flex items-center gap-2">
                <Fan className={cn('w-4 h-4 shrink-0', fanOn && activeMode === 'manual' && 'animate-spin')} />
                Kipas Exhaust
              </span>
              <span className="text-[10px] font-black uppercase">
                {fanOn && activeMode === 'manual' ? 'ON' : 'OFF'}
              </span>
            </button>

            <button 
              onClick={togglePump}
              disabled={activeMode !== 'manual'}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300',
                pumpOn && activeMode === 'manual'
                  ? 'border-sky-200 bg-sky-50 dark:border-sky-900/30 dark:bg-sky-950/20 text-sky-600 dark:text-sky-450' 
                  : 'border-surface-150 dark:border-surface-850 bg-surface-50 dark:bg-surface-950 text-surface-500 dark:text-surface-440 disabled:opacity-40'
              )}
            >
              <span className="text-xs font-bold flex items-center gap-2">
                <Droplet className="w-4 h-4 shrink-0" />
                Pompa Air
              </span>
              <span className="text-[10px] font-black uppercase">
                {pumpOn && activeMode === 'manual' ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Semicircular Thin Ring Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardGauge 
          value={liveData.temperature} 
          min={10} 
          max={50} 
          label="Parameter Lingkungan" 
          unit="°C" 
          color="orange" 
          status={liveData.temperature > 35 ? 'Stres Suhu' : 'Optimal'} 
          icon={Thermometer}
          extraInfo={
            <>
              <div className="flex justify-between">
                <span>Lembab Udara:</span>
                <span className="font-bold text-surface-900 dark:text-surface-100">{formatNumber(liveData.humidity, 1)} %</span>
              </div>
              <div className="flex justify-between">
                <span>Tekanan Defisit (VPD):</span>
                <span className="font-bold text-purple-500 dark:text-purple-400">{formatNumber(liveData.vpd, 1)} kPa</span>
              </div>
            </>
          }
        />

        <DashboardGauge 
          value={avgSoil} 
          min={0} 
          max={100} 
          label="Kadar Air Tanah Media" 
          unit="%" 
          color="emerald" 
          status={avgSoil < 45 ? 'Kering' : 'Kecukupan'} 
          icon={Droplet}
          extraInfo={
            <>
              <div className="flex justify-between">
                <span>Sensor Zona A:</span>
                <span className="font-bold text-surface-900 dark:text-surface-100">{liveData.soilMoistureA} %</span>
              </div>
              <div className="flex justify-between">
                <span>Sensor Zona B:</span>
                <span className="font-bold text-surface-900 dark:text-surface-100">{liveData.soilMoistureB} %</span>
              </div>
            </>
          }
        />

        <DashboardGauge 
          value={liveData.batteryVoltage} 
          min={11} 
          max={15} 
          label="Monitoring Daya Utama" 
          unit="V" 
          color="yellow" 
          status={sourceDaya.toUpperCase()} 
          icon={Battery}
          extraInfo={
            <>
              <div className="flex justify-between">
                <span>Tegangan Tertinggi (Max):</span>
                <span className="font-bold text-rose-500">{formatNumber(maxAki, 1)} V</span>
              </div>
              <div className="flex justify-between">
                <span>Tegangan Terendah (Min):</span>
                <span className="font-bold text-sky-500">{formatNumber(minAki, 1)} V</span>
              </div>
            </>
          }
        />
      </div>

      {/* Cultivation Summary & Pipeline Graphic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cultivation Summary */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <h3 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2 text-surface-700 dark:text-surface-300">
            <ClipboardList className="w-4 h-4 text-primary-500" />
            Ringkasan Konfigurasi Budidaya
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs mt-4">
            <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 flex justify-between items-center">
              <span className="text-surface-500 dark:text-surface-400 font-medium">Usia Tanaman:</span>
              <strong className="text-emerald-600 dark:text-emerald-455 font-bold">{Math.floor(hstSekarang)} HST</strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 flex justify-between items-center">
              <span className="text-surface-500 dark:text-surface-400 font-medium">Target Dosis Siram:</span>
              <strong className="text-primary-600 dark:text-primary-400 font-bold">{targetSiram} ml/pohon</strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 flex justify-between items-center">
              <span className="text-surface-500 dark:text-surface-400 font-medium">Jadwal Selanjutnya:</span>
              <strong className="text-teal-600 dark:text-teal-400 font-bold">{jadwalSelanjutnya}</strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 flex justify-between items-center">
              <span className="text-surface-500 dark:text-surface-400 font-medium">Jam Terakhir Siram:</span>
              <strong className="text-orange-600 dark:text-orange-455 font-bold">{penyiramanTerakhir}</strong>
            </div>
            <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 col-span-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-500 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed text-surface-600 dark:text-surface-300">
                <span className="font-semibold text-surface-500 uppercase tracking-wide block text-[10px] mb-0.5">Progress Hari Ini</span>
                Sistem otomatis telah mendistribusikan pengairan ke-<strong className="text-primary-600 dark:text-primary-455 text-sm font-black mx-1">{penyiramanKe}</strong> hari ini.
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Energy Flow Pipeline */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-surface-100 dark:border-surface-800 pb-3 mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wide text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-500 animate-pulse" />
              Aliran Daya & Energi Hybrid (Real-Time)
            </h4>
            <span className={cn(
              'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
              sourceDaya === 'plts' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-455 border-emerald-100 dark:border-emerald-900/40' :
              sourceDaya === 'baterai' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-405 border-blue-100 dark:border-blue-900/40' :
              'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-455 border-amber-100 dark:border-amber-900/40'
            )}>
              Sumber Aktif: {sourceDaya.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-around py-6 bg-surface-50 dark:bg-surface-950 rounded-2xl border border-surface-100 dark:border-surface-800 relative overflow-hidden my-auto">
            {/* Energy Source Node */}
            <div className="flex flex-col items-center gap-2 z-10 w-24 text-center">
              {sourceDaya === 'plts' ? (
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 dark:border-emerald-400 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-md animate-bounce">
                  <Sun className="w-6 h-6" />
                </div>
              ) : sourceDaya === 'baterai' ? (
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-md animate-pulse">
                  <Battery className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500 dark:border-amber-400 flex items-center justify-center text-amber-400 shadow-md animate-pulse">
                  <Zap className="w-6 h-6" />
                </div>
              )}
              <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300">
                {sourceDaya === 'plts' ? 'Panel Surya' : sourceDaya === 'baterai' ? 'Baterai' : 'Grid PLN'}
              </span>
            </div>

            {/* Path 1 */}
            <div className="flex-1 flex justify-center items-center relative px-2">
              <div className="w-full h-1 bg-surface-200 dark:bg-surface-800 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-1/2 animate-[ping_2s_infinite] rounded-full"></div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-700 absolute" />
            </div>

            {/* Controller Node */}
            <div className="flex flex-col items-center gap-2 z-10 w-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-teal-500 dark:text-teal-400 shadow-soft">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300">ESP32 Core</span>
            </div>

            {/* Path 2 */}
            <div className="flex-1 flex justify-center items-center relative px-2">
              <div className="w-full h-1 bg-surface-200 dark:bg-surface-800 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-1/2 animate-[ping_2s_infinite] rounded-full"></div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-700 absolute" />
            </div>

            {/* Greenhouse Node */}
            <div className="flex flex-col items-center gap-2 z-10 w-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 dark:border-emerald-400 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-inner">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-440">Greenhouse</span>
            </div>
          </div>

          <div className="mt-4">
            <a href="/analisis" className="w-full inline-flex justify-center items-center px-4 py-3 text-xs font-bold uppercase text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 rounded-xl shadow-lg hover:shadow-emerald-500/10 active:scale-95">
              Buka Analisis Grafik Runtun Waktu &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* History 7 points graph */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Kurva Tren Parameter (7 Log Terakhir)</h3>
            <p className="text-xs text-surface-500 dark:text-surface-440 mt-0.5 font-medium">Analisis tren runtun waktu instrumen greenhouse</p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-150 dark:border-surface-850 max-w-sm sm:max-w-md">
            {[
              { id: 'climate', label: 'Iklim' },
              { id: 'vpd', label: 'VPD' },
              { id: 'soil', label: 'Tanah' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChartMetric(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                  chartMetric === tab.id
                    ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200/60 dark:border-surface-800'
                    : 'text-surface-500 hover:text-surface-800 dark:text-surface-440 dark:hover:text-surface-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === 'climate' ? (
              <AreaChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area name="Suhu Udara" type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" unit="°C" animationDuration={800} />
                <Area name="Kelembaban" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHum)" unit="%" animationDuration={800} />
              </AreaChart>
            ) : chartMetric === 'vpd' ? (
              <AreaChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area name="VPD" type="monotone" dataKey="vpd" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVpd)" unit=" kPa" animationDuration={800} />
              </AreaChart>
            ) : (
              <AreaChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSoilA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSoilB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area name="Soil A" type="monotone" dataKey="soilMoistureA" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSoilA)" unit="%" animationDuration={800} />
                <Area name="Soil B" type="monotone" dataKey="soilMoistureB" stroke="#047857" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSoilB)" unit="%" animationDuration={800} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats footer widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-4 shadow-soft">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-4xl">Tegangan Aki Tertinggi</span>
          <p className="text-xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{formatNumber(maxAki)} V</p>
          <span className="text-[9px] text-rose-505 dark:text-rose-400 font-bold uppercase tracking-wider">Maks Hari Ini</span>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-4 shadow-soft">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-4xl">Tegangan Aki Terendah</span>
          <p className="text-xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{formatNumber(minAki)} V</p>
          <span className="text-[9px] text-sky-505 dark:text-sky-400 font-bold uppercase tracking-wider">Min Hari Ini</span>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-4 shadow-soft">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-4xl">Total Pengairan</span>
          <p className="text-xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{penyiramanKe}x</p>
          <span className="text-[9px] text-surface-400 dark:text-surface-500 font-bold tracking-wide">Vol: {penyiramanKe * targetSiram} ml</span>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-4 shadow-soft">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-4xl">Sinkronisasi Terakhir</span>
          <p className="text-xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{formatTime(new Date(liveData.timestamp))}</p>
          <span className="text-[9px] text-primary-500 font-bold flex items-center gap-1.5 mt-0.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" /> Realtime Link
          </span>
        </div>
      </div>
    </div>
  );
}