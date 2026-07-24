import { useState, useMemo, useCallback } from 'react';
import { useRealtimeSensor } from '../hooks/useRealtimeSensor';
import { 
  CalendarDays, CalendarPlus, Plus, Trash2, Save, 
  Clock, Sliders, PlayCircle, PlusCircle, Sprout 
} from 'lucide-react';

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

export function JadwalPage() {
  const { config, updateConfig } = useRealtimeSensor();

  // Local state fallbacks if Firebase config is loading/empty
  // Ubah dari '2026-06-16' menjadi '2026-05-20'
  const [localPlantingDate, setLocalPlantingDate] = useState('2026-05-20');
  const [localSchedules, setLocalSchedules] = useState<ScheduleItem[]>(defaultSchedules);

  // Form states
  const [hstMulai, setHstMulai] = useState('');
  const [hstSelesai, setHstSelesai] = useState('');
  const [targetMl, setTargetMl] = useState('');
  const [waktuSiram, setWaktuSiram] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const hasRealData = config !== null;

  // Resolve values from database or local state
  const plantingDate = hasRealData && config.plantingDate ? config.plantingDate : localPlantingDate;
  const schedules: ScheduleItem[] = useMemo(() => {
    if (hasRealData && config.schedules) {
      return config.schedules;
    }
    return localSchedules;
  }, [config, localSchedules, hasRealData]);

  // Calculate current HST based on plantingDate
// Calculate current HST based on plantingDate (Timezone Safe)
  const hstBerjalan = useMemo(() => {
    if (!plantingDate) return 1;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(plantingDate);
    const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    const diffInMs = now.getTime() - startLocal.getTime();
    const diffInDays = Math.floor(diffInMs / (24 * 3600 * 1000));

    return diffInDays < 0 ? 0 : diffInDays + 1;
  }, [plantingDate]);

  const handleSavePlantingDate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasRealData) {
      await updateConfig('plantingDate', plantingDate);
      showNotification('Tanggal tanam berhasil disinkronkan ke Firebase!');
    } else {
      showNotification('Mode simulasi: Tanggal tanam disimpan lokal.');
    }
  }, [hasRealData, plantingDate, updateConfig]);

const handleAddSchedule = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hstMulai || !hstSelesai || !targetMl || !waktuSiram) {
      alert('Tolong lengkapi semua input form jadwal!');
      return;
    }

    // FIX: Sanitasi ketat untuk memastikan format selalu "HH:MM" tanpa spasi tersembunyi
    const jamArray = waktuSiram
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => {
        const parts = t.split(':');
        if (parts.length === 2) {
          const h = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          return `${h}:${m}`;
        }
        return t;
      });

    const newJadwal: ScheduleItem = {
      id: Date.now().toString(),
      hst_mulai: Number(hstMulai),
      hst_selesai: Number(hstSelesai),
      target_ml: Number(targetMl),
      waktu_siram: jamArray,
    };

    if (hasRealData) {
      const updatedSchedules = [...schedules, newJadwal].sort((a, b) => a.hst_mulai - b.hst_mulai);
      await updateConfig('schedules', updatedSchedules);
      showNotification('Jadwal baru berhasil ditambahkan ke Firebase!');
    } else {
      setLocalSchedules(prev => [...prev, newJadwal].sort((a, b) => a.hst_mulai - b.hst_mulai));
      showNotification('Mode simulasi: Jadwal baru ditambahkan secara lokal.');
    }

    setHstMulai('');
    setHstSelesai('');
    setTargetMl('');
    setWaktuSiram('');
  }, [hasRealData, hstMulai, hstSelesai, targetMl, waktuSiram, schedules, updateConfig]);

  const handleDeleteSchedule = useCallback(async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    if (hasRealData) {
      const updated = schedules.filter(s => s.id !== id);
      await updateConfig('schedules', updated);
      showNotification('Jadwal berhasil dihapus dari Firebase!');
    } else {
      setLocalSchedules(prev => prev.filter(s => s.id !== id));
      showNotification('Jadwal simulasi berhasil dihapus.');
    }
  }, [hasRealData, schedules, updateConfig]);

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-surface-900 dark:text-surface-100">
      
      {/* Page Title & Status */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-500">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pengaturan SOP & Jadwal Siram</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 font-medium">GREENFLOW — GREENHOUSE OPERATIONAL PROCEDURE</p>
          </div>
        </div>
        
        <div className="px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 font-bold tracking-wide shadow-sm text-center text-xs flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-emerald-500" />
          Usia Tanaman: <span className="text-white bg-emerald-500 px-2 py-0.5 rounded-lg ml-0.5 font-mono">{hstBerjalan} HST</span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 shadow-sm animate-pulse">
          <PlayCircle className="w-4 h-4 shrink-0" />
          {notification}
        </div>
      )}

      {/* Cycle & Add Schedule Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atur Siklus Awal Tanam */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-surface-500 dark:text-surface-400 tracking-wider uppercase flex items-center gap-2 border-b border-surface-150 dark:border-surface-850 pb-2.5 mb-4">
              <CalendarPlus className="w-4 h-4 text-emerald-500" />
              Atur Siklus Awal Tanam
            </h3>

            <form onSubmit={handleSavePlantingDate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Tanggal Mulai Menanam</label>
                <input 
                  type="date" 
                  value={plantingDate}
                  onChange={(e) => {
                    if (hasRealData) {
                      updateConfig('plantingDate', e.target.value);
                    } else {
                      setLocalPlantingDate(e.target.value);
                    }
                  }}
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2.5 text-surface-850 dark:text-surface-250 text-xs focus:outline-none focus:border-emerald-500 font-mono transition"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition rounded-xl shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan & Sinkron Alat
              </button>
            </form>
          </div>
          
          <div className="mt-6 p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-850 text-[10px] text-surface-500 leading-relaxed font-medium">
            Perubahan tanggal tanam otomatis menyesuaikan perhitungan grafik target pengairan harian instrumentasi Anda.
          </div>
        </div>

        {/* Tambah Rentang Jadwal SOP */}
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft lg:col-span-2">
          <h3 className="text-xs font-bold text-surface-500 dark:text-surface-400 tracking-wider uppercase flex items-center gap-2 border-b border-surface-150 dark:border-surface-850 pb-2.5 mb-4">
            <PlusCircle className="w-4 h-4 text-primary-500" />
            Tambah Rentang Jadwal SOP
          </h3>

          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase mb-1.5">HST Mulai</label>
                <input 
                  type="number" 
                  value={hstMulai}
                  onChange={(e) => setHstMulai(e.target.value)}
                  placeholder="Contoh: 1" 
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2 text-surface-900 dark:text-surface-100 text-xs focus:outline-none focus:border-primary-500 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase mb-1.5">HST Selesai</label>
                <input 
                  type="number" 
                  value={hstSelesai}
                  onChange={(e) => setHstSelesai(e.target.value)}
                  placeholder="Contoh: 10" 
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2 text-surface-900 dark:text-surface-100 text-xs focus:outline-none focus:border-primary-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase mb-1.5">Target Nutrisi (ml / Pohon)</label>
                <input 
                  type="number" 
                  value={targetMl}
                  onChange={(e) => setTargetMl(e.target.value)}
                  placeholder="Contoh: 250" 
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2 text-surface-900 dark:text-surface-100 text-xs focus:outline-none focus:border-primary-500 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase mb-1.5">Alokasi Waktu Siram (Pisahkan Koma)</label>
                <input 
                  type="text" 
                  value={waktuSiram}
                  onChange={(e) => setWaktuSiram(e.target.value)}
                  placeholder="Contoh: 06:00, 12:00, 18:00" 
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2 text-surface-900 dark:text-surface-100 text-xs focus:outline-none focus:border-primary-500 transition font-mono"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 text-xs font-bold uppercase text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              Simpan Jadwal Rencana SOP
            </button>
          </form>
        </div>
      </div>

      {/* Rencana Distribusi Nutrisi Table */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft">
        <h4 className="text-xs font-bold text-surface-500 dark:text-surface-400 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-500" />
          Matriks Rencana Distribusi Nutrisi Otomatis
        </h4>
        <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 text-surface-500 dark:text-surface-400 font-bold uppercase text-[10px]">
                <th className="p-4 text-center">Fase Mulai</th>
                <th className="p-4 text-center">Fase Akhir</th>
                <th className="p-4">Dosis Target</th>
                <th className="p-4">Plot Waktu Siram</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-150 dark:divide-surface-800 font-medium text-surface-700 dark:text-surface-300">
              {schedules.map((jadwal) => (
                <tr key={jadwal.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition">
                  <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-450">{jadwal.hst_mulai} HST</td>
                  <td className="p-4 text-center font-bold text-teal-600 dark:text-teal-450">{jadwal.hst_selesai} HST</td>
                  <td className="p-4 font-bold text-primary-600 dark:text-primary-400">{jadwal.target_ml} ml / pohon</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(jadwal.waktu_siram) && jadwal.waktu_siram.map((jam, index) => (
                        <span 
                          key={index}
                          className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 px-2.5 py-0.5 rounded-lg text-surface-800 dark:text-surface-200 font-mono text-[10px] inline-flex items-center gap-1 shadow-sm"
                        >
                          <Clock className="w-3 h-3 text-slate-400" />
                          {jam}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDeleteSchedule(jadwal.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-500 dark:bg-rose-950/20 text-rose-600 hover:text-white rounded-lg border border-rose-100 dark:border-rose-900/40 text-[10px] font-bold transition shadow-sm inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-surface-400 font-bold uppercase tracking-wider">
                    Belum ada matriks jadwal SOP yang diinput ke sistem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
