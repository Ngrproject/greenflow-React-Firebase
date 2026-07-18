import { useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import { useRealtimeSensor } from '../hooks/useRealtimeSensor';

export function ControlPage() {
  // 1. Connect to Firebase Realtime Database
  const { liveData: rtdbLiveData, sendCommand, calibratePump } = useRealtimeSensor();

  // 2. Local fallback states for offline simulation
  const [simulatedPumpOn, setSimulatedPumpOn] = useState(false);
  const [simulatedFanOn, setSimulatedFanOn] = useState(true);
  const [simulatedValveOn, setSimulatedValveOn] = useState(true);
  const [simulatedMode, setSimulatedMode] = useState<'auto' | 'manual' | 'schedule'>('auto');
  const [pumpSpeed, setPumpSpeed] = useState(75);
  const [calibrationInput, setCalibrationInput] = useState(2.5);

  const hasRealData = rtdbLiveData !== null && rtdbLiveData.actuators !== undefined;

  const mode = hasRealData && rtdbLiveData ? rtdbLiveData.actuators.mode : simulatedMode;
  const pumpOn = hasRealData && rtdbLiveData ? rtdbLiveData.actuators.pump : simulatedPumpOn;
  const fanOn = hasRealData && rtdbLiveData ? rtdbLiveData.actuators.fan : simulatedFanOn;
  const valveOn = hasRealData && rtdbLiveData ? rtdbLiveData.actuators.valve : simulatedValveOn;

  const handleModeChange = useCallback(async (newMode: 'auto' | 'manual' | 'schedule') => {
    if (hasRealData) {
      await sendCommand({ mode: newMode });
    } else {
      setSimulatedMode(newMode);
    }
  }, [hasRealData, sendCommand]);

  const handleTogglePump = useCallback(async () => {
    if (hasRealData && rtdbLiveData) {
      await sendCommand({ pump: !rtdbLiveData.actuators.pump });
    } else {
      setSimulatedPumpOn(p => !p);
    }
  }, [hasRealData, rtdbLiveData, sendCommand]);

  const handleToggleFan = useCallback(async () => {
    if (hasRealData && rtdbLiveData) {
      await sendCommand({ fan: !rtdbLiveData.actuators.fan });
    } else {
      setSimulatedFanOn(f => !f);
    }
  }, [hasRealData, rtdbLiveData, sendCommand]);

  const handleToggleValve = useCallback(async () => {
    if (hasRealData && rtdbLiveData) {
      await sendCommand({ valve: !rtdbLiveData.actuators.valve });
    } else {
      setSimulatedValveOn(v => !v);
    }
  }, [hasRealData, rtdbLiveData, sendCommand]);

  const handleCalibrate = useCallback(async () => {
    if (hasRealData) {
      await calibratePump(calibrationInput);
      alert(`Kalibrasi pompa berhasil disimpan ke Firebase: ${calibrationInput} ml/detik`);
    } else {
      alert(`Mode simulasi: Kalibrasi ${calibrationInput} ml/detik disimpan lokal.`);
    }
  }, [hasRealData, calibrationInput, calibratePump]);

  const schedules = [
    { id: '1', name: 'Pagi', time: '06:00', enabled: true, volumeMl: 150 },
    { id: '2', name: 'Siang', time: '12:00', enabled: true, volumeMl: 200 },
    { id: '3', name: 'Sore', time: '18:00', enabled: true, volumeMl: 150 },
    { id: '4', name: 'Malam', time: '21:00', enabled: false, volumeMl: 100 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">Kontrol Aktuator</h1>
          
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-surface-500 dark:text-surface-400">Kontrol manual pompa, kipas, dan katup solenoid</p>
            <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded shadow-sm transition-colors',
              hasRealData 
                ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400'
            )}>
              {hasRealData ? 'Firebase RTDB: Terhubung' : 'Simulasi Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Operation Mode Selector */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4 tracking-tight">Mode Operasi</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'auto', label: 'Otomatis', desc: 'Berdasarkan sensor', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
            { id: 'manual', label: 'Manual', desc: 'Kontrol penuh pengguna', icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75' },
            { id: 'schedule', label: 'Terjadwal', desc: 'Berdasarkan jadwal HST', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id as typeof mode)}
              className={cn(
                'flex-1 min-w-[180px] p-4 rounded-xl border-2 transition-all duration-200 text-left',
                mode === m.id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                  : 'border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  'p-2 rounded-lg',
                  mode === m.id ? 'bg-primary-600 text-white' : 'bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                )}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                  </svg>
                </div>
                <div>
                  <div className={cn('font-semibold', mode === m.id ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-surface-100')}>{m.label}</div>
                  <div className="text-xs text-surface-500">{m.desc}</div>
                </div>
              </div>
              {mode === m.id && (
                <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-semibold mt-1">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-ping" />
                  <span>Aktif</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Actuators */}
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4 tracking-tight">Aktuator Fisik</h3>
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg transition-colors', pumpOn ? 'bg-primary-100 dark:bg-primary-950/40 text-primary-600' : 'bg-surface-200 dark:bg-surface-800 text-surface-400')}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V7.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 7.5v3m0 0v3m0-3h-1.5a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h1.5m0 0h9" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-surface-900 dark:text-surface-100">Pompa Air</div>
                  <div className="text-xs text-surface-500">Sistem fertigasi tetes</div>
                </div>
              </div>
              <button
                onClick={handleTogglePump}
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
                  pumpOn ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
                )}
              >
                <span className={cn(
                  'inline-block h-6 w-6 rounded-full bg-white shadow transform transition duration-200',
                  pumpOn ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg transition-colors', fanOn ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' : 'bg-surface-200 dark:bg-surface-800 text-surface-400')}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-surface-900 dark:text-surface-100">Kipas Exhaust</div>
                  <div className="text-xs text-surface-500">Sirkulasi & pembuangan udara panas</div>
                </div>
              </div>
              <button
                onClick={handleToggleFan}
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
                  fanOn ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
                )}
              >
                <span className={cn(
                  'inline-block h-6 w-6 rounded-full bg-white shadow transform transition duration-200',
                  fanOn ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg transition-colors', valveOn ? 'bg-green-100 dark:bg-green-950/40 text-green-600' : 'bg-surface-200 dark:bg-surface-800 text-surface-400')}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-surface-900 dark:text-surface-100">Katup Solenoid</div>
                  <div className="text-xs text-surface-500">Kontrol katup input nutrisi</div>
                </div>
              </div>
              <button
                onClick={handleToggleValve}
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
                  valveOn ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
                )}
              >
                <span className={cn(
                  'inline-block h-6 w-6 rounded-full bg-white shadow transform transition duration-200',
                  valveOn ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Calibration & Speed Settings */}
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4 tracking-tight">Kalibrasi & Kecepatan</h3>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                Kecepatan Aliran Pompa
              </label>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{pumpSpeed}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={pumpSpeed}
              onChange={(e) => setPumpSpeed(Number(e.target.value))}
              disabled={mode === 'auto'}
              className="w-full h-2 rounded-full appearance-none bg-surface-200 dark:bg-surface-800/80 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>0% (Mati)</span>
              <span>100% (Maks)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
            <h4 className="font-bold text-surface-900 dark:text-surface-100 text-sm mb-2">Kalibrasi Debit Pompa</h4>
            <p className="text-xs text-surface-500 mb-3 leading-relaxed">Masukkan volume debit ml per detik pompa air fertigasi Anda untuk penyesuaian yang presisi.</p>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="number"
                value={calibrationInput}
                onChange={(e) => setCalibrationInput(Number(e.target.value))}
                step={0.1}
                className="w-full sm:w-28 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-xs text-surface-500 dark:text-surface-400 font-semibold shrink-0">ml/detik</span>
              <button 
                onClick={handleCalibrate}
                className="w-full sm:w-auto sm:ml-auto px-4 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
              >
                Simpan Kalibrasi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watering Schedules Table */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2 tracking-tight">Jadwal Penyiraman</h3>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">Hari Setelah Tanam (HST): 30 hari • Fase Pertumbuhan: Vegetatif</p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-3 px-4 font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Nama Jadwal</th>
                <th className="text-left py-3 px-4 font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Waktu Mulai</th>
                <th className="text-left py-3 px-4 font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Volume Air</th>
                <th className="text-left py-3 px-4 font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50/40 dark:hover:bg-surface-800/35 transition-colors">
                  <td className="py-3.5 px-4 text-surface-900 dark:text-surface-100 font-semibold">{s.name}</td>
                  <td className="py-3.5 px-4 text-surface-600 dark:text-surface-400 font-medium">{s.time}</td>
                  <td className="py-3.5 px-4 text-surface-600 dark:text-surface-400 font-medium">{s.volumeMl} ml</td>
                  <td className="py-3.5 px-4">
                    <span className={cn('badge font-semibold px-2 py-0.5 text-[10px] shadow-sm', s.enabled ? 'badge-success' : 'badge-gray')}>
                      {s.enabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-bold">
                      {s.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}