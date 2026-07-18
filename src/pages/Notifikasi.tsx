import { useState, useEffect } from 'react';
import { ref, onValue, remove, query, limitToLast } from 'firebase/database';
import { rtdb } from '../lib/firebase'; // Memastikan mengarah ke file konfigurasi Firebase Anda
import { Bell, Trash2, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

interface NotificationLog {
  id: string;
  message: string;
  timestamp: number;
}

export function NotifikasiPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 📡 1. Listener Real-Time dari Firebase RTDB (Membaca 100 log notifikasi terakhir)
  useEffect(() => {
    const logsRef = query(ref(rtdb, 'logs/greenflow-001'), limitToLast(100));
    
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Mengubah objek Firebase menjadi Array dan diurutkan dari yang terbaru (paling atas)
        const formattedLogs: NotificationLog[] = Object.keys(data).map((key) => ({
          id: key,
          message: data[key].message || '',
          timestamp: data[key].timestamp || Date.now(),
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setNotifications(formattedLogs);
      } else {
        setNotifications([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching logs: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🗑️ 2. Fungsi untuk Membersihkan Semua Log di Database
  const handleClearAllLogs = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat notifikasi dari database?')) {
      try {
        await remove(ref(rtdb, 'logs/greenflow-001'));
        alert('Semua log sistem berhasil dibersihkan!');
      } catch (error) {
        console.error("Gagal menghapus log: ", error);
        alert('Gagal membersihkan log.');
      }
    }
  };

  // ⚙️ Helper untuk mendeteksi warna border/bg notifikasi berdasarkan isi pesan teks
  const getLogStyle = (msg: string) => {
    if (msg.includes('✅') || msg.toLowerCase().includes('selesai')) {
      return 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    }
    if (msg.includes('⏱️') || msg.includes('🛑') || msg.toLowerCase().includes('jeda')) {
      return 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }
    return 'border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 text-surface-700 dark:text-surface-300';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-surface-900 dark:text-surface-100">
      
      {/* 💳 Header Card */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 flex items-center justify-center text-sky-500">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white transition-colors duration-300">
              Pusat Notifikasi & Log Sistem
            </h2>
            <p className="text-xs mt-0.5 text-surface-500 dark:text-surface-400 uppercase tracking-wider font-medium">
              GREENFLOW — NATIVE WEB TELEMETRY LOG SYSTEM
            </p>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <button 
            onClick={handleClearAllLogs}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:text-white uppercase tracking-wider border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-600 dark:hover:bg-rose-600 rounded-xl shadow-sm transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Bersihkan Semua Log
          </button>
        )}
      </div>

      {/* 📦 Main content container */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-soft transition-all duration-300 min-h-[250px] flex flex-col justify-center">
        
        {isLoading ? (
          <div className="text-center text-xs font-bold text-surface-400 animate-pulse flex flex-col items-center gap-2">
            <MessageSquare className="w-5 h-5 animate-bounce text-sky-500" />
            Memuat riwayat log perangkat telemetry...
          </div>
        ) : notifications.length === 0 ? (
          /* Tampilan Kosong Default Sesuai Mockup Kamu */
          <div className="text-center text-xs font-bold text-surface-400/80 uppercase tracking-wider flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500" />
            👎 Belum ada riwayat notifikasi baru yang terekam di web.
          </div>
        ) : (
          /* Daftar Notifikasi Aktual ESP32 */
          <div className="space-y-3 w-full my-auto">
            {notifications.map((log) => (
              <div 
                key={log.id}
                className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all duration-200 ${getLogStyle(log.message)}`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-sm font-semibold tracking-wide leading-relaxed">
                    {log.message}
                  </span>
                </div>
                
                {/* Penanda Waktu Log Masuk */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 whitespace-nowrap sm:ml-auto">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })} WIB
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}