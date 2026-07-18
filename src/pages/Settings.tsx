import { useState } from 'react';
import { cn } from '../lib/utils';

const hstPhases = [
  { name: 'Semai', startDay: 0, endDay: 14, irrigationMl: 50, ec: 0.8, ph: 5.8, color: 'bg-green-500' },
  { name: 'Vegetatif', startDay: 15, endDay: 45, irrigationMl: 100, ec: 1.2, ph: 6.0, color: 'bg-primary-600' },
  { name: 'Berbunga', startDay: 46, endDay: 70, irrigationMl: 150, ec: 1.8, ph: 6.2, color: 'bg-yellow-500' },
  { name: 'Berbuah', startDay: 71, endDay: 100, irrigationMl: 200, ec: 2.0, ph: 6.2, color: 'bg-orange-500' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('hst');

  const tabs = [
    { id: 'hst', label: 'Kalender HST' },
    { id: 'setpoints', label: 'Setpoint' },
    { id: 'calibration', label: 'Kalibrasi' },
    { id: 'wifi', label: 'Jaringan' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pengaturan</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Konfigurasi perangkat dan parameter sistem</p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'hst' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Kalender Hari Setelah Tanam (HST)</h3>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Tanggal Tanam</label>
                <input
                  type="date"
                  defaultValue="2026-06-15"
                  className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 px-4 py-2 text-sm text-surface-900 dark:text-surface-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">HST Saat Ini</label>
                <div className="px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-300">30</span>
                  <span className="text-sm text-primary-500 ml-1">hari</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Fase Saat Ini</label>
                <div className="px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Vegetatif</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left py-3 px-4 font-medium text-surface-500">Nama Fase</th>
                    <th className="text-center py-3 px-4 font-medium text-surface-500">Rentang HST</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Volume (ml/siklus)</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Target EC</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Target pH</th>
                  </tr>
                </thead>
                <tbody>
                  {hstPhases.map((phase) => (
                    <tr key={phase.name} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('inline-block w-2 h-2 rounded-full', phase.color)} />
                          <span className="font-medium text-surface-900 dark:text-surface-100">{phase.name}</span>
                        </div>
                      </td>
                      <td className="text-center text-surface-600 dark:text-surface-400">HST {phase.startDay} - {phase.endDay}</td>
                      <td className="text-right text-surface-900 dark:text-surface-100">
                        <input type="number" defaultValue={phase.irrigationMl} className="w-20 text-right rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-2 py-1 text-sm" />
                      </td>
                      <td className="text-right text-surface-900 dark:text-surface-100">
                        <input type="number" defaultValue={phase.ec} step={0.1} className="w-16 text-right rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-2 py-1 text-sm" />
                      </td>
                      <td className="text-right text-surface-900 dark:text-surface-100">
                        <input type="number" defaultValue={phase.ph} step={0.1} className="w-16 text-right rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-2 py-1 text-sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                Simpan Pengaturan HST
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Visualisasi Fase Tanam</h3>
            <div className="relative h-12 rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden">
              {hstPhases.map((phase) => {
                const totalDays = 100;
                const width = ((phase.endDay - phase.startDay) / totalDays) * 100;
                const left = (phase.startDay / totalDays) * 100;
                return (
                  <div
                    key={phase.name}
                    className={cn('absolute h-full flex items-center justify-center text-xs font-medium text-white', phase.color)}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {phase.name}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-surface-400">
              <span>HST 0</span>
              <span>HST 50</span>
              <span>HST 100</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'setpoints' && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Setpoint & Ambang Batas</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Konfigurasi ambang batas untuk mode otomatis</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Suhu Minimum', key: 'tempMin', value: 20, unit: '°C' },
              { label: 'Suhu Maksimum', key: 'tempMax', value: 35, unit: '°C' },
              { label: 'Kelembaban Min', key: 'humMin', value: 50, unit: '%' },
              { label: 'Kelembaban Maks', key: 'humMax', value: 85, unit: '%' },
              { label: 'VPD Minimum', key: 'vpdMin', value: 0.4, unit: 'kPa' },
              { label: 'VPD Maksimum', key: 'vpdMax', value: 1.6, unit: 'kPa' },
              { label: 'pH Minimum', key: 'phMin', value: 5.5, unit: '' },
              { label: 'pH Maksimum', key: 'phMax', value: 6.5, unit: '' },
              { label: 'EC Minimum', key: 'ecMin', value: 0.8, unit: 'mS/cm' },
              { label: 'EC Maksimum', key: 'ecMax', value: 2.2, unit: 'mS/cm' },
              { label: 'Kelemb. Tanah Min', key: 'soilMin', value: 45, unit: '%' },
              { label: 'Baterai Kritis', key: 'batCrit', value: 11.5, unit: 'V' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">{item.label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    defaultValue={item.value}
                    step={item.value < 1 ? 0.1 : item.value < 3 ? 0.1 : 1}
                    className="w-20 text-right rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1 text-sm text-surface-900 dark:text-surface-100"
                  />
                  {item.unit && <span className="text-sm text-surface-500 w-10">{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
              Simpan Setpoint
            </button>
          </div>
        </div>
      )}

      {activeTab === 'calibration' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Kalibrasi Sensor & Aktuator</h3>
            <div className="space-y-4">
              {[
                { label: 'Debit Pompa', value: '2.5', unit: 'ml/detik', desc: 'Kalibrasi volume air per detik' },
                { label: 'Offset Suhu', value: '0.0', unit: '°C', desc: 'Koreksi pembacaan sensor DHT22' },
                { label: 'Offset Kelembaban', value: '0.0', unit: '%', desc: 'Koreksi pembacaan sensor DHT22' },
                { label: 'Offset pH', value: '0.0', unit: '', desc: 'Koreksi pembacaan sensor pH' },
                { label: 'Offset EC', value: '0.0', unit: 'mS/cm', desc: 'Koreksi pembacaan sensor EC' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                  <div>
                    <div className="font-medium text-surface-900 dark:text-surface-100">{item.label}</div>
                    <div className="text-xs text-surface-500 mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={item.value}
                      step={0.1}
                      className="w-20 text-right rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100"
                    />
                    {item.unit && <span className="text-sm text-surface-500 w-16">{item.unit}</span>}
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                      Kalibrasi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Manajemen Sistem</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-surface-900 dark:text-surface-100">Restart Perangkat</div>
                  <div className="text-xs text-surface-500">Restart ESP32 dari jarak jauh</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-surface-900 dark:text-surface-100">Firmware OTA</div>
                  <div className="text-xs text-surface-500">Update firmware over-the-air</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wifi' && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Konfigurasi Jaringan</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Atur koneksi Wi-Fi greenhouse</p>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Nama Wi-Fi (SSID)</label>
              <input
                type="text"
                defaultValue="Greenhouse_WiFi"
                placeholder="Masukkan nama Wi-Fi"
                className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password Wi-Fi</label>
              <input
                type="password"
                defaultValue="password123"
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm text-yellow-700 dark:text-yellow-400">Jika password berubah, gunakan portal hotspot "GreenFlow-Config" dari ponsel</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                Simpan & Hubungkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}