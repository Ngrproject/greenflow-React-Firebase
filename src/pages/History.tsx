import { useState, useMemo } from 'react';
import { cn, formatNumber, formatDateTime, formatDate } from '../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const timeRanges = [
  { label: '1 Jam', value: '1h' },
  { label: '6 Jam', value: '6h' },
  { label: '24 Jam', value: '24h' },
  { label: '7 Hari', value: '7d' },
  { label: '30 Hari', value: '30d' },
];

const chartTypes = [
  { label: 'Suhu & Kelembaban', value: 'climate' },
  { label: 'VPD', value: 'vpd' },
  { label: 'pH & EC', value: 'ph_ec' },
  { label: 'Kelembaban Tanah', value: 'soil' },
  { label: 'Baterai', value: 'battery' },
];

const dummyAlerts = [
  { id: '1', type: 'warning', title: 'Suhu Melebihi Batas', message: 'Suhu mencapai 39.2°C pada pukul 14:23', time: Date.now() - 3600000, acknowledged: false },
  { id: '2', type: 'critical', title: 'Baterai Kritis', message: 'Tegangan baterai < 11.5V, beralih ke PLN', time: Date.now() - 7200000, acknowledged: true },
  { id: '3', type: 'info', title: 'Penyiraman Otomatis', message: 'Siklus penyiraman ke-4 selesai (150ml)', time: Date.now() - 10800000, acknowledged: true },
  { id: '4', type: 'warning', title: 'Kelembaban Tinggi', message: 'Kelembaban mencapai 88% pada pukul 06:12', time: Date.now() - 14400000, acknowledged: false },
  { id: '5', type: 'info', title: 'Sistem Restart', message: 'Restart mandiri harian pukul 05:00 berhasil', time: Date.now() - 18000000, acknowledged: true },
];

const dailySummaries = [
  { date: '2026-07-15', tempMin: 22.1, tempMax: 33.7, tempAvg: 27.4, humidityMin: 55, humidityMax: 88, humidityAvg: 72, irrigationCount: 6, totalVolumeMl: 1200, batteryMin: 12.1, batteryMax: 13.8, alertsCount: 2 },
  { date: '2026-07-14', tempMin: 21.5, tempMax: 34.2, tempAvg: 27.8, humidityMin: 52, humidityMax: 85, humidityAvg: 70, irrigationCount: 5, totalVolumeMl: 1000, batteryMin: 12.3, batteryMax: 14.1, alertsCount: 1 },
  { date: '2026-07-13', tempMin: 22.8, tempMax: 32.9, tempAvg: 26.9, humidityMin: 58, humidityMax: 82, humidityAvg: 68, irrigationCount: 6, totalVolumeMl: 1200, batteryMin: 12.0, batteryMax: 13.9, alertsCount: 0 },
  { date: '2026-07-12', tempMin: 21.9, tempMax: 35.1, tempAvg: 28.2, humidityMin: 51, humidityMax: 86, humidityAvg: 71, irrigationCount: 7, totalVolumeMl: 1400, batteryMin: 11.8, batteryMax: 14.0, alertsCount: 3 },
  { date: '2026-07-11', tempMin: 23.1, tempMax: 33.4, tempAvg: 27.1, humidityMin: 56, humidityMax: 84, humidityAvg: 69, irrigationCount: 5, totalVolumeMl: 1000, batteryMin: 12.2, batteryMax: 13.7, alertsCount: 1 },
  { date: '2026-07-10', tempMin: 22.4, tempMax: 34.8, tempAvg: 28.5, humidityMin: 53, humidityMax: 87, humidityAvg: 73, irrigationCount: 6, totalVolumeMl: 1200, batteryMin: 12.4, batteryMax: 14.2, alertsCount: 2 },
  { date: '2026-07-09', tempMin: 21.8, tempMax: 33.1, tempAvg: 27.0, humidityMin: 57, humidityMax: 83, humidityAvg: 67, irrigationCount: 5, totalVolumeMl: 1000, batteryMin: 12.5, batteryMax: 13.6, alertsCount: 0 },
];

// Helper to generate dynamic history data matching user filters
function generateHistoryData(timeRange: string): any[] {
  let length = 24;
  let interval = 3600 * 1000; // default 1 hour
  
  if (timeRange === '1h') {
    length = 12;
    interval = 5 * 60 * 1000;
  } else if (timeRange === '6h') {
    length = 36;
    interval = 10 * 60 * 1000;
  } else if (timeRange === '24h') {
    length = 24;
    interval = 3600 * 1000;
  } else if (timeRange === '7d') {
    length = 7;
    interval = 24 * 3600 * 1000;
  } else if (timeRange === '30d') {
    length = 30;
    interval = 24 * 3600 * 1000;
  }

  const data: any[] = [];
  const now = Date.now();
  for (let i = length - 1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    const tempBase = 25 + 5.5 * Math.sin(((hour - 8) / 12) * Math.PI);
    const temperature = tempBase + (Math.random() - 0.5) * 0.7;
    const humidity = 80 - 18 * Math.sin(((hour - 8) / 12) * Math.PI) + (Math.random() - 0.5) * 2;
    const vpd = Math.max(0.1, parseFloat(((0.61078 * Math.exp((17.27 * temperature) / (temperature + 237.3))) * (1 - humidity / 100)).toFixed(2)));
    const batteryVoltage = 12.3 + 1.5 * Math.sin(((hour - 7) / 12) * Math.PI) + (Math.random() - 0.5) * 0.1;
    
    data.push({
      timestamp,
      temperature,
      humidity,
      vpd,
      ph: 5.9 + Math.sin(i / 8) * 0.2 + (Math.random() - 0.5) * 0.04,
      ec: 1.3 + Math.sin(i / 10) * 0.12 + (Math.random() - 0.5) * 0.04,
      soilMoistureA: 55 + Math.sin(i / 4) * 6 + (Math.random() - 0.5) * 1.5,
      soilMoistureB: 58 + Math.sin(i / 5) * 5 + (Math.random() - 0.5) * 1.5,
      batteryVoltage,
      batteryPercent: Math.min(100, Math.max(0, Math.floor(((batteryVoltage - 11.5) / 1.5) * 100))),
    });
  }
  return data;
}

// Custom tooltip component for visual consistency
const CustomTooltip = ({ active, payload, label, timeRange }: any) => {
  if (active && payload && payload.length) {
    const dateObj = new Date(label);
    const dateStr = timeRange === '7d' || timeRange === '30d'
      ? dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-soft">
        <p className="text-xs text-surface-500 dark:text-surface-400 font-bold mb-1.5 border-b border-surface-100 dark:border-surface-800 pb-1">
          {dateStr}
        </p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pld.color }} />
              <span className="text-surface-600 dark:text-surface-400 text-xs">{pld.name}:</span>
              <span className="font-semibold text-surface-900 dark:text-surface-50 ml-auto">
                {formatNumber(pld.value, pld.name.toLowerCase().includes('ph') || pld.name.toLowerCase().includes('ec') || pld.name.toLowerCase().includes('baterai') ? 2 : 1)}
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

export function HistoryPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [chartType, setChartType] = useState('climate');
  const [showAlerts, setShowAlerts] = useState(true);

  // Generate historical data dynamically based on range and metric type
  const chartData = useMemo(() => generateHistoryData(timeRange), [timeRange]);

  const xTickFormatter = (timestamp: number) => {
    const d = new Date(timestamp);
    if (timeRange === '7d' || timeRange === '30d') {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">Riwayat & Analitik</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Data historis sensor, laporan harian, dan notifikasi</p>
      </div>

      {/* Filter and Selection Section */}
      <div className="flex flex-col gap-4">
        {/* Time range selection */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-100 dark:bg-surface-800/60 self-start">
          {timeRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                timeRange === r.value
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Metric selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          {chartTypes.map((c) => (
            <button
              key={c.value}
              onClick={() => setChartType(c.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200',
                chartType === c.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/40'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Recharts Graph Panel */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
        <h3 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-4">
          Grafik {chartTypes.find(c => c.value === chartType)?.label} ({timeRanges.find(r => r.value === timeRange)?.label})
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'climate' ? (
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={xTickFormatter} className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <YAxis className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
                <Area name="Suhu Udara" type="monotone" dataKey="temperature" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" unit="°C" animationDuration={800} />
                <Area name="Kelembaban" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHum)" unit="%" animationDuration={800} />
              </AreaChart>
            ) : chartType === 'vpd' ? (
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={xTickFormatter} className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <YAxis className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
                <Area name="VPD" type="monotone" dataKey="vpd" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVpd)" unit=" kPa" animationDuration={800} />
              </AreaChart>
            ) : chartType === 'ph_ec' ? (
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={xTickFormatter} className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <YAxis className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
                <Area name="pH Nutrisi" type="monotone" dataKey="ph" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPh)" unit="" animationDuration={800} />
                <Area name="EC Nutrisi" type="monotone" dataKey="ec" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEc)" unit=" mS/cm" animationDuration={800} />
              </AreaChart>
            ) : chartType === 'soil' ? (
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSoilA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSoilB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={xTickFormatter} className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <YAxis className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
                <Area name="Kelembaban Tanah A" type="monotone" dataKey="soilMoistureA" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSoilA)" unit="%" animationDuration={800} />
                <Area name="Kelembaban Tanah B" type="monotone" dataKey="soilMoistureB" stroke="#84cc16" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSoilB)" unit="%" animationDuration={800} />
              </AreaChart>
            ) : (
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBatt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200/70 dark:stroke-surface-800/70" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={xTickFormatter} className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <YAxis className="text-[10px] font-bold fill-surface-400" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip timeRange={timeRange} />} />
                <Area name="Tegangan Baterai" type="monotone" dataKey="batteryVoltage" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBatt)" unit=" V" animationDuration={800} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Summaries & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily summary table */}
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">Rekapitulasi Harian</h3>
            <span className="text-xs text-surface-400">Laporan otomatis setiap 18:00</span>
          </div>
          <div className="overflow-y-auto max-h-[380px] scrollbar-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-2.5 pr-2 font-semibold text-surface-500">Tanggal</th>
                  <th className="text-right py-2.5 px-1.5 font-semibold text-surface-500">Min</th>
                  <th className="text-right py-2.5 px-1.5 font-semibold text-surface-500">Max</th>
                  <th className="text-right py-2.5 px-1.5 font-semibold text-surface-500">Rata-Rata</th>
                  <th className="text-right py-2.5 px-1.5 font-semibold text-surface-500">Siram</th>
                  <th className="text-right py-2.5 pl-2 font-semibold text-surface-500">Volume</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.map((d) => (
                  <tr key={d.date} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40">
                    <td className="py-2.5 pr-2 text-surface-900 dark:text-surface-100 font-medium whitespace-nowrap">{formatDate(d.date)}</td>
                    <td className="text-right py-2.5 px-1.5 text-blue-600 dark:text-blue-400 font-semibold">{formatNumber(d.tempMin)}°</td>
                    <td className="text-right py-2.5 px-1.5 text-red-600 dark:text-red-400 font-semibold">{formatNumber(d.tempMax)}°</td>
                    <td className="text-right py-2.5 px-1.5 text-surface-600 dark:text-surface-400 font-medium">{formatNumber(d.tempAvg)}°</td>
                    <td className="text-right py-2.5 px-1.5 text-surface-600 dark:text-surface-400 font-medium">{d.irrigationCount}x</td>
                    <td className="text-right py-2.5 pl-2 text-surface-600 dark:text-surface-400 font-medium">{d.totalVolumeMl}ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts log panel */}
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">
              Notifikasi {!showAlerts && <span className="text-xs font-normal text-surface-400">(disembunyikan)</span>}
            </h3>
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 font-semibold transition-colors"
            >
              {showAlerts ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          {showAlerts && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin">
              {dummyAlerts.map((alert) => (
                <div key={alert.id} className={cn(
                  'p-3.5 rounded-xl border text-sm transition-all duration-300',
                  alert.type === 'critical' ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 shadow-sm' :
                  alert.type === 'warning' ? 'bg-yellow-50/70 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/60 shadow-sm' :
                  'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'inline-block w-2.5 h-2.5 rounded-full shrink-0',
                          alert.type === 'critical' ? 'bg-red-500 animate-pulse' :
                          alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        )} />
                        <span className={cn(
                          'font-bold text-[10px] uppercase tracking-wider',
                          alert.type === 'critical' ? 'text-red-700 dark:text-red-400' :
                          alert.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                          'text-blue-700 dark:text-blue-400'
                        )}>
                          {alert.type === 'critical' ? 'Kritis' : alert.type === 'warning' ? 'Peringatan' : 'Info'}
                        </span>
                        {!alert.acknowledged && alert.type !== 'info' && (
                          <span className="badge-danger text-[9px] font-bold px-2 py-0 bg-red-600 text-white rounded">Baru</span>
                        )}
                      </div>
                      <p className="font-bold text-surface-900 dark:text-surface-100 mt-2 tracking-tight">{alert.title}</p>
                      <p className="text-surface-500 dark:text-surface-400 text-xs mt-1 leading-relaxed">{alert.message}</p>
                    </div>
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 font-semibold shrink-0 whitespace-nowrap mt-0.5">{formatDateTime(alert.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}