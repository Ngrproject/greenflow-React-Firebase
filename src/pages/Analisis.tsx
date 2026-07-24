import { useMemo, } from 'react';
import { cn, formatNumber, calculateVPD } from '../lib/utils';
import { useRealtimeHistory } from '../hooks/useRealtimeSensor';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { 
  Download, TrendingUp, BarChart3, PieChart as PieIcon, 
  Thermometer, Droplets, Gauge, Zap, Calendar, Search, Sprout 
} from 'lucide-react';

interface LogEntry {
  temperature: number;
  humidity: number;
  vpd: number;
  soilMoistureA: number;
  soilMoistureB: number;
  batteryVoltage: number;
  statusDaya: 'Solar Panel' | 'Baterai' | 'PLN';
  pumpStatus: number;
  fanStatus: number;
  timestamp: number;
}

const CustomTooltip = ({ active, payload, label, showTime = true }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-soft">
        {showTime && (
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1.5 border-b border-surface-100 dark:border-surface-800 pb-1">
            {new Date(label).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pld.stroke || pld.fill }} />
              <span className="text-surface-600 dark:text-surface-400 text-xs">{pld.name}:</span>
              <span className="font-semibold text-surface-900 dark:text-surface-50 ml-auto">
                {formatNumber(pld.value, pld.name.toLowerCase().includes('ph') || pld.name.toLowerCase().includes('ec') || pld.name.toLowerCase().includes('aki') || pld.name.toLowerCase().includes('tegangan') ? 2 : 1)}
                {pld.unit && <span className="text-[10px] font-normal text-surface-500 ml-0.5">{pld.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function AverageIndicator({ value, max = 100, label, unit, color, icon: Icon }: { value: number; max?: number; label: string; unit: string; color: 'orange' | 'blue' | 'emerald' | 'yellow'; icon: any }) {
  const percentage = Math.min(100, (value / max) * 100);
  
  const colors = {
    orange: 'border-orange-500 dark:border-orange-400',
    blue: 'border-blue-500 dark:border-blue-400',
    emerald: 'border-emerald-500 dark:border-emerald-400',
    yellow: 'border-yellow-500 dark:border-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft text-center flex flex-col justify-between transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-center text-surface-500 dark:text-surface-450 text-[10px] font-bold uppercase tracking-wider">
        <span>Rata-Rata</span>
        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
      </div>
      <div className="my-4 flex justify-center">
        <div className="relative w-28 h-14 overflow-hidden flex items-end justify-center">
          <div className="w-28 h-28 border-[5px] border-surface-100 dark:border-surface-800 rounded-full absolute top-0 left-0"></div>
          <div 
            className={cn('w-28 h-28 border-[6px] rounded-full absolute top-0 left-0 origin-center transition-transform duration-1000 ease-out', colors[color])}
            style={{ 
              transform: `rotate(${(percentage * 1.8) - 180}deg)`, 
              clipPath: 'inset(0px 0px 56px 0px)' 
            }}
          ></div>
        </div>
      </div>
      <div>
        <span className="text-3xl font-black text-surface-900 dark:text-surface-50 tracking-tight">
          {formatNumber(value)}
          <span className="text-sm font-normal text-surface-500 ml-0.5">{unit}</span>
        </span>
        <span className="block text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide mt-1">{label}</span>
      </div>
    </div>
  );
}

export function AnalisisPage() {
  // Mengambil 60 log terakhir dari database (jika update tiap 1 menit, berarti mencakup data 1 jam terakhir)
  const { history: rtdbHistory } = useRealtimeHistory(60); 

  // Sinkronisasi data utama dari Firebase Firestore / RTDB riwayat ESP32
  const logs: LogEntry[] = useMemo(() => {
    if (rtdbHistory && rtdbHistory.length > 0) {
      return rtdbHistory.map((h: any) => {
        //const hour = new Date(h.timestamp).getHours();
        
        // Logika penentuan sumber energi berdasarkan parameter pembacaan tegangan aki asli ESP32
        let statusDaya: 'Solar Panel' | 'Baterai' | 'PLN' = 'Baterai';
        if (h.batteryVoltage > 12.5) statusDaya = 'Solar Panel';
        else if (h.batteryVoltage > 11.5) statusDaya = 'Baterai';
        else statusDaya = 'PLN';

        return {
          temperature: h.temperature || 0,
          humidity: h.humidity || 0,
          vpd: h.vpd || calculateVPD(h.temperature || 0, h.humidity || 0),
          soilMoistureA: h.soilMoistureA || 0,
          soilMoistureB: h.soilMoistureB || 0,
          batteryVoltage: h.batteryVoltage || 0,
          statusDaya,
          pumpStatus: (h.pump !== undefined ? h.pump : h.pumpState) ? 1 : 0, 
          fanStatus: (h.fan !== undefined ? h.fan : h.fanState) ? 1 : 0,   
          timestamp: h.timestamp || Date.now(),
        };
      });
    }
    return []; // Mengembalikan array kosong jika koneksi database/alat belum mengirim log riwayat
  }, [rtdbHistory]);

  // Kalkulasi nilai rata-rata berdasarkan data aktual database
  const avgSuhu = useMemo(() => {
    if (logs.length === 0) return 0;
    return Number((logs.reduce((sum, entry) => sum + entry.temperature, 0) / logs.length).toFixed(1));
  }, [logs]);

  const avgLembabUdara = useMemo(() => {
    if (logs.length === 0) return 0;
    return Number((logs.reduce((sum, entry) => sum + entry.humidity, 0) / logs.length).toFixed(1));
  }, [logs]);

  const avgSoil = useMemo(() => {
    if (logs.length === 0) return 0;
    const soilA = logs.reduce((sum, entry) => sum + entry.soilMoistureA, 0) / logs.length;
    const soilB = logs.reduce((sum, entry) => sum + entry.soilMoistureB, 0) / logs.length;
    return Math.round((soilA + soilB) / 2);
  }, [logs]);

  const avgTeganganAki = useMemo(() => {
    if (logs.length === 0) return 0;
    return Number((logs.reduce((sum, entry) => sum + entry.batteryVoltage, 0) / logs.length).toFixed(1));
  }, [logs]);

  // Kalkulasi nilai batas ekstrem maksimum dan minimum dari database asli
  const stats = useMemo(() => {
    if (logs.length === 0) {
      return {
        maxSuhu: 0, minSuhu: 0, maxLembab: 0, minLembab: 0,
        maxSoilA: 0, minSoilA: 0, maxSoilB: 0, minSoilB: 0, maxAki: 0, minAki: 0,
      };
    }
    const temps = logs.map(e => e.temperature);
    const hums = logs.map(e => e.humidity);
    const soilsA = logs.map(e => e.soilMoistureA);
    const soilsB = logs.map(e => e.soilMoistureB);
    const akis = logs.map(e => e.batteryVoltage);

    return {
      maxSuhu: Math.max(...temps),
      minSuhu: Math.min(...temps),
      maxLembab: Math.max(...hums),
      minLembab: Math.min(...hums),
      maxSoilA: Math.max(...soilsA),
      minSoilA: Math.min(...soilsA),
      maxSoilB: Math.max(...soilsB),
      minSoilB: Math.min(...soilsB),
      maxAki: Math.max(...akis),
      minAki: Math.min(...akis),
    };
  }, [logs]);

  const donutData = useMemo(() => {
    const solarCount = logs.filter(e => e.statusDaya === 'Solar Panel').length;
    const batCount = logs.filter(e => e.statusDaya === 'Baterai').length;
    const plnCount = logs.filter(e => e.statusDaya === 'PLN').length;

    return [
      { name: 'Solar Panel', value: solarCount, color: '#10b981' },
      { name: 'Baterai', value: batCount, color: '#3b82f6' },
      { name: 'PLN', value: plnCount, color: '#eab308' },
    ].filter(d => d.value > 0);
  }, [logs]);

  const handleExport = () => {
    alert('Menyiapkan file download aktual: GreenFlow_IoT_Report.xlsx');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-surface-900 dark:text-surface-100">
      
      {/* Title Header Block */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analisis & Laporan</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 font-medium">MULTI RANGE TIME SERIES MONITORING SYSTEM</p>
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 rounded-xl shadow-md active:scale-95"
        >
          <Download className="w-4 h-4" />
          Unduh Laporan Excel
        </button>
      </div>

      {/* Informasi Sinkronisasi Waktu Aktual */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-4 shadow-soft flex items-center justify-between">
        <span className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          Status Sinkronisasi Waktu Kontrol:
        </span>
        <div className="px-3 py-1.5 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Terhubung Otomatis dengan ESP32 (Siklus Update 1 Menit)
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-12 text-center text-sm font-bold text-surface-400 animate-pulse">
          Menunggu kiriman data log runtun waktu pertama dari ESP32 ke Firebase database...
        </div>
      ) : (
        <>
          {/* Averages meter indicators row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <AverageIndicator value={avgSuhu} max={50} label="Suhu Udara" unit="°C" color="orange" icon={Thermometer} />
            <AverageIndicator value={avgLembabUdara} max={100} label="Lembab Udara" unit="%" color="blue" icon={Droplets} />
            <AverageIndicator value={avgSoil} max={100} label="Lembab Tanah" unit="%" color="emerald" icon={Gauge} />
            <AverageIndicator value={avgTeganganAki} max={15} label="Tegangan Aki" unit="V" color="yellow" icon={Zap} />
          </div>

          {/* Extremum Table summary */}
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft">
            <h4 className="text-xs font-bold text-surface-500 dark:text-surface-450 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-500" /> Ringkasan Batas Ekstrem Parameter (Rentang Aktif)
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 text-surface-500 dark:text-surface-400 font-bold uppercase">
                    <th className="p-4">Nama Parameter Sensor</th>
                    <th className="p-4 text-rose-600 dark:text-rose-455">Nilai Maksimum (Max)</th>
                    <th className="p-4 text-sky-600 dark:text-sky-400">Nilai Minimum (Min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-150 dark:divide-surface-800 font-medium text-surface-700 dark:text-surface-300">
                  <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition">
                    <td className="p-4 font-semibold flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-orange-500" /> Suhu Udara Lingkungan</td>
                    <td className="p-4 text-rose-600 dark:text-rose-455 font-bold">{formatNumber(stats.maxSuhu)} °C</td>
                    <td className="p-4 text-sky-600 dark:text-sky-400 font-bold">{formatNumber(stats.minSuhu)} °C</td>
                  </tr>
                  <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition">
                    <td className="p-4 font-semibold flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-500" /> Kelembaban Udara Makro</td>
                    <td className="p-4 text-rose-600 dark:text-rose-455 font-bold">{formatNumber(stats.maxLembab)} %</td>
                    <td className="p-4 text-sky-600 dark:text-sky-400 font-bold">{formatNumber(stats.minLembab)} %</td>
                  </tr>
                  <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition">
                    <td className="p-4 font-semibold flex items-center gap-1.5"><Sprout className="w-4 h-4 text-emerald-500" /> Kelembaban Media Tanah (A)</td>
                    <td className="p-4 text-rose-600 dark:text-rose-455 font-bold">{formatNumber(stats.maxSoilA)} %</td>
                    <td className="p-4 text-sky-600 dark:text-sky-400 font-bold">{formatNumber(stats.minSoilA)} %</td>
                  </tr>
                  <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition">
                    <td className="p-4 font-semibold flex items-center gap-1.5"><Sprout className="w-4 h-4 text-emerald-600" /> Kelembaban Media Tanah (B)</td>
                    <td className="p-4 text-rose-600 dark:text-rose-455 font-bold">{formatNumber(stats.maxSoilB)} %</td>
                    <td className="p-4 text-sky-600 dark:text-sky-400 font-bold">{formatNumber(stats.minSoilB)} %</td>
                  </tr>
                  <tr className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition">
                    <td className="p-4 font-semibold flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Tegangan Energi Sistem Aki</td>
                    <td className="p-4 text-rose-600 dark:text-rose-455 font-bold">{formatNumber(stats.maxAki, 2)} V</td>
                    <td className="p-4 text-sky-600 dark:text-sky-400 font-bold">{formatNumber(stats.minAki, 2)} V</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-graph plots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft">
              <h4 className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase mb-4 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary-500" /> Tren Iklim Udara & Nilai VPD
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-surface-100 dark:stroke-surface-800" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line name="Suhu Udara" type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} unit="°C" />
                    <Line name="Lembab Udara" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} unit="%" />
                    <Line name="VPD" type="monotone" dataKey="vpd" stroke="#a855f7" strokeWidth={2} dot={false} unit=" kPa" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft">
              <h4 className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase mb-4 tracking-wider flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-500" /> Tren Kelembaban Tanah Media Tanam (Soil A & B)
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-surface-100 dark:stroke-surface-800" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line name="Soil A" type="monotone" dataKey="soilMoistureA" stroke="#10b981" strokeWidth={2} dot={false} unit="%" />
                    <Line name="Soil B" type="monotone" dataKey="soilMoistureB" stroke="#047857" strokeWidth={2} dot={false} unit="%" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft md:col-span-2">
              <h4 className="text-xs font-bold text-primary-500 uppercase mb-4 tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Grafik Histori Log Kerja Alat (Pompa & Kipas Exhaust)
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logs} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-surface-100 dark:stroke-surface-800" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis ticks={[0, 1]} tickFormatter={(v) => v === 1 ? 'ON' : 'OFF'} className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip showTime={false} />} />
                    <Bar name="Pompa" dataKey="pumpStatus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Kipas" dataKey="fanStatus" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft">
              <h4 className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase mb-4 tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-500" /> Tren Tegangan Suplai Aki (Voltase)
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-surface-100 dark:stroke-surface-800" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(t) => {
                        // Mengonversi unix timestamp murni ke jam lokal komputer (WIB)
                        return new Date(Number(t)).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        }).replace('.', ':'); // Mengubah titik bawaan id-ID menjadi standar titik dua (HH:MM)
                      }}
                      className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis domain={[10, 15]} className="text-[10px] font-bold fill-surface-400 dark:fill-surface-500" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line name="Tegangan Aki" type="monotone" dataKey="batteryVoltage" stroke="#eab308" strokeWidth={2} dot={false} unit=" V" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
            <h4 className="text-xs font-bold text-surface-500 dark:text-surface-450 uppercase mb-6 tracking-wider text-center flex items-center justify-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-500" />
              Proporsi Distribusi Status Sumber Daya Listrik (Hari Ini)
            </h4>
            <div className="h-64 flex items-center justify-center">
              <div className="w-80 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-2xl font-black text-surface-900 dark:text-surface-50">100%</span>
                  <span className="text-[9px] text-surface-500 uppercase tracking-widest font-bold">Total Hari Ini</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-6 text-xs font-bold text-surface-600 dark:text-surface-300 mt-4">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span>{d.name} ({d.value} log)</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}