import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import { useRealtimeSensor } from '../hooks/useRealtimeSensor';
import { useUIStore } from '../stores/index';
import { 
  Sliders, Fan, Droplet, RotateCw, Sun, Moon, Save 
} from 'lucide-react';

export function PengaturanAlatPage() {
  const { config, updateMultipleConfig } = useRealtimeSensor();
  
  // Theme control using app UI store
  const { theme, setTheme } = useUIStore();

  // Local form states matching database fields
  const [suhuKipasOn, setSuhuKipasOn] = useState('39.0');
  const [suhuKipasOff, setSuhuKipasOff] = useState('37.0');
  const [lembabKipasOn, setLembabKipasOn] = useState('85');
  const [lembabKipasOff, setLembabKipasOff] = useState('80');
  
  // Battery Saver Feature States
  const [batterySaverStatus, setBatterySaverStatus] = useState(false);
  const [batterySaverTime, setBatterySaverTime] = useState('night_only');
  const [kipasSiklusOn, setKipasSiklusOn] = useState('120');
  const [kipasSiklusOff, setKipasSiklusOff] = useState('60');
  
  const [tanahPompaOn, setTanahPompaOn] = useState('45');
  const [tanahPompaOff, setTanahPompaOff] = useState('75');
  const [detikKalibrasiPompa, setDetikKalibrasiPompa] = useState('33.3');

  const [autoRestartStatus, setAutoRestartStatus] = useState(false);
  const [autoRestartTime, setAutoRestartTime] = useState('05:00');

  const [notification, setNotification] = useState<string | null>(null);

  // Sync inputs with DB config on load/change
  useEffect(() => {
    if (config) {
      if (config.suhu_kipas_on !== undefined) setSuhuKipasOn(String(config.suhu_kipas_on));
      if (config.suhu_kipas_off !== undefined) setSuhuKipasOff(String(config.suhu_kipas_off));
      if (config.lembab_kipas_on !== undefined) setLembabKipasOn(String(config.lembab_kipas_on));
      if (config.lembab_kipas_off !== undefined) setLembabKipasOff(String(config.lembab_kipas_off));
      
      // Sync Battery Saver states from Firebase
      if (config.battery_saver_status !== undefined) setBatterySaverStatus(Boolean(config.battery_saver_status));
      if (config.battery_saver_time !== undefined) setBatterySaverTime(String(config.battery_saver_time));
      if (config.kipas_siklus_on !== undefined) setKipasSiklusOn(String(config.kipas_siklus_on));
      if (config.kipas_siklus_off !== undefined) setKipasSiklusOff(String(config.kipas_siklus_off));

      if (config.tanah_pompa_on !== undefined) setTanahPompaOn(String(config.tanah_pompa_on));
      if (config.tanah_pompa_off !== undefined) setTanahPompaOff(String(config.tanah_pompa_off));
      
      if (config.detik_kalibrasi_pompa !== undefined) {
        setDetikKalibrasiPompa(String(config.detik_kalibrasi_pompa));
      } else if (config.debit_pompa !== undefined && config.debit_pompa > 0) {
        setDetikKalibrasiPompa(String(Math.round(100.0 / config.debit_pompa * 10) / 10));
      }

      if (config.auto_restart_status !== undefined) setAutoRestartStatus(Boolean(config.auto_restart_status));
      if (config.auto_restart_time !== undefined) {
        const timePart = config.auto_restart_time.split(':');
        if (timePart.length >= 2) {
          setAutoRestartTime(`${timePart[0]}:${timePart[1]}`);
        } else {
          setAutoRestartTime(config.auto_restart_time);
        }
      }
    }
  }, [config]);

const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const seconds = Number(detikKalibrasiPompa);
    const debit = seconds > 0 ? Math.round((100.0 / seconds) * 100) / 100 : 3.0;

    // Menyiapkan string waktu HH:MM bersih tanpa detik berlebih
    const formattedRestartTime = autoRestartTime.length >= 5 ? autoRestartTime.slice(0, 5) : '02:00';

    const payload = {
      suhu_kipas_on: Number(suhuKipasOn),
      suhu_kipas_off: Number(suhuKipasOff),
      lembab_kipas_on: Number(lembabKipasOn),
      lembab_kipas_off: Number(lembabKipasOff),
      battery_saver_status: batterySaverStatus,
      battery_saver_time: batterySaverTime,
      kipas_siklus_on: Number(kipasSiklusOn),
      kipas_siklus_off: Number(kipasSiklusOff),
      tanah_pompa_on: Number(tanahPompaOn),
      tanah_pompa_off: Number(tanahPompaOff),
      detik_kalibrasi_pompa: seconds,
      debit_pompa: debit,
      auto_restart_status: autoRestartStatus,
      auto_restart_time: formattedRestartTime, // FIX: Mengirim HH:MM bersih
    };

    if (config !== null) {
      await updateMultipleConfig(payload);
      setNotification('Parameter instrumen greenhouse berhasil disinkronkan ke database Firebase!');
    } else {
      setNotification('Mode simulasi: Konfigurasi berhasil disimpan secara lokal.');
    }

    setTimeout(() => setNotification(null), 4000);
  }, [
    config, suhuKipasOn, suhuKipasOff, lembabKipasOn, lembabKipasOff,
    batterySaverStatus, batterySaverTime, kipasSiklusOn, kipasSiklusOff,
    tanahPompaOn, tanahPompaOff, detikKalibrasiPompa, autoRestartStatus,
    autoRestartTime, updateMultipleConfig
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-surface-900 dark:text-surface-100">
      
      {/* Title Header Card */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-500">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white transition-colors duration-300">
              Pusat Kendali & Parameter Alat
            </h2>
            <p className="text-xs mt-0.5 text-surface-500 dark:text-surface-400">
              GREENFLOW — ADVANCED SYSTEM OPERATIONAL PROCEDURE (SOP)
            </p>
          </div>
        </div>
        
        <div className="px-5 py-2.5 rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-650 dark:text-teal-400 font-bold tracking-wide shadow-sm text-center text-xs">
          📡 Alokasi Jaringan: <span className="text-teal-700 dark:text-white bg-teal-500/20 dark:bg-teal-500 px-2 py-0.5 rounded-lg font-mono text-[11px] ml-1">PORTAL DHCP ENABLED</span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 shadow-sm animate-pulse">
          <Save className="w-4 h-4 shrink-0" />
          {notification}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fan Limits Card */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft space-y-4 transition-all duration-300">
          <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b pb-2.5 text-surface-700 dark:text-white border-surface-150 dark:border-white/5">
            <Fan className="w-4 h-4 text-emerald-500" />
            Ambang Batas Kipas Exhaust
          </h3>
          
          <div className="space-y-3">
            <div className="p-3.5 bg-surface-50 dark:bg-surface-950/40 rounded-2xl border border-surface-100 dark:border-surface-850 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-orange-600 dark:text-orange-400 uppercase block">
                🌡️ Berdasarkan Suhu Lingkungan
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Kipas ON (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={suhuKipasOn}
                    onChange={(e) => setSuhuKipasOn(e.target.value)}
                    className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Kipas OFF (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={suhuKipasOff}
                    onChange={(e) => setSuhuKipasOff(e.target.value)}
                    className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-surface-50 dark:bg-surface-950/40 rounded-2xl border border-surface-100 dark:border-surface-850 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-blue-600 dark:text-blue-400 uppercase block">
                💧 Berdasarkan Kelembaban Udara
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kipas ON (%)</label>
                  <input 
                    type="number" 
                    value={lembabKipasOn}
                    onChange={(e) => setLembabKipasOn(e.target.value)}
                    className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kipas OFF (%)</label>
                  <input 
                    type="number" 
                    value={lembabKipasOff}
                    onChange={(e) => setLembabKipasOff(e.target.value)}
                    className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Battery Saver Segment */}
            <div className="p-3.5 bg-surface-50 dark:bg-surface-950/40 rounded-2xl border border-surface-100 dark:border-surface-850 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase block">
                  🔋 Mode Battery Saver
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={batterySaverStatus}
                    onChange={(e) => setBatterySaverStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-200 dark:bg-surface-850 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-400 peer-checked:after:bg-emerald-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/20 border border-surface-200 dark:border-white/5"></div>
                </label>
              </div>

              {batterySaverStatus && (
                <div className="space-y-3 animate-fade-in pt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Waktu Aktif Fitur</label>
                    <select
                      value={batterySaverTime}
                      onChange={(e) => setBatterySaverTime(e.target.value)}
                      className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-2 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-medium transition-colors"
                    >
                      <option value="night_only">Hanya Malam Hari Saja</option>
                      <option value="full_day">Sepanjang Hari (Siang & Malam)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Siklus ON (Mnt)</label>
                      <input 
                        type="number" 
                        value={kipasSiklusOn}
                        onChange={(e) => setKipasSiklusOn(e.target.value)}
                        className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Siklus OFF (Mnt)</label>
                      <input 
                        type="number" 
                        value={kipasSiklusOff}
                        onChange={(e) => setKipasSiklusOff(e.target.value)}
                        className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pump Limits & Calibration Card */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft space-y-4 transition-all duration-300">
          <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b pb-2.5 text-surface-700 dark:text-white border-surface-150 dark:border-white/5">
            <Droplet className="w-4 h-4 text-emerald-500" />
            Kontrol & Kalibrasi Pompa
          </h3>
          
          <div className="space-y-3">
            <div className="p-3.5 bg-surface-50 dark:bg-surface-950/40 rounded-2xl border border-surface-100 dark:border-surface-850 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase block">
                🌱 Batas Kelembaban Tanah
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pompa ON (%)</label>
                  <input 
                    type="number" 
                    value={tanahPompaOn}
                    onChange={(e) => setTanahPompaOn(e.target.value)}
                    className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-teal-500 font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pompa OFF (%)</label>
                  <input 
                    type="number" 
                    value={tanahPompaOff}
                    onChange={(e) => setTanahPompaOff(e.target.value)}
                    className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-teal-500 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-surface-50 dark:bg-surface-950/40 rounded-2xl border border-surface-100 dark:border-surface-850 space-y-1.5">
              <label className="block text-[10px] font-black text-surface-700 dark:text-surface-400 uppercase tracking-wider mb-1.5">
                ⏱️ Waktu Kalibrasi Pompa (Detik / 100ml)
              </label>
              <input 
                type="number" 
                step="0.1" 
                value={detikKalibrasiPompa}
                onChange={(e) => setDetikKalibrasiPompa(e.target.value)}
                className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-teal-500 font-mono text-center transition-colors"
              />
              <span className="text-[9px] text-surface-400 dark:text-surface-500 block leading-normal mt-1 font-medium">
                Perhitungan IoT: volume debit dihitung {detikKalibrasiPompa ? (Math.round(10000.0 / Number(detikKalibrasiPompa)) / 100).toFixed(2) : '3.00'} ml/detik.
              </span>
            </div>
          </div>
        </div>

        {/* Auto Restart Maintenance Card */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft space-y-4 transition-all duration-300">
          <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b pb-2.5 text-surface-700 dark:text-white border-surface-150 dark:border-white/5">
            <RotateCw className="w-4 h-4 text-emerald-500" />
            Pemeliharaan Auto Restart
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-850">
              <span className="text-[10px] font-bold text-surface-700 dark:text-surface-400 uppercase tracking-wider">Status Auto-Restart</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoRestartStatus}
                  onChange={(e) => setAutoRestartStatus(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-200 dark:bg-surface-850 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-400 peer-checked:after:bg-emerald-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/20 border border-surface-200 dark:border-white/5"></div>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-1.5">Jadwal Jam Restart Rutin</label>
              <input 
                type="time" 
                value={autoRestartTime}
                onChange={(e) => setAutoRestartTime(e.target.value)}
                className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2.5 text-xs text-surface-850 dark:text-surface-200 focus:outline-none focus:border-sky-500 font-mono text-center transition-colors"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-850 flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">🎨 Tema Dashboard</span>
                <span className="text-[9px] text-surface-500 dark:text-surface-400 block leading-tight">
                  {theme === 'dark' ? 'Premium Dark' : 'Windows Light'}
                </span>
              </div>
              
              <button 
                type="button" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className={cn(
                  'px-3 py-1.5 rounded-xl border font-bold text-[10px] uppercase tracking-wide transition-all duration-200 shadow-sm flex items-center gap-1',
                  theme === 'dark' 
                    ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100/50' 
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                )}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-650" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action submit button */}
        <div className="lg:col-span-3">
          <button 
            type="submit" 
            className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 text-xs font-bold uppercase text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 rounded-xl shadow-md active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            Sinkronisasikan Seluruh Konfigurasi Sistem Utama
          </button>
        </div>
      </form>
    </div>
  );
}