import { useState, useEffect, } from 'react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { db, auth } from '../lib/firebase'; // Memastikan instance auth dan db di-import dari file konfigurasi Firebase Anda

// Interface untuk tipe data User agar tidak ada error TypeScript
interface UserConfig {
  id: string;
  name: string;
  email: string;
  role: string;
  devices: string[];
  status: string;
  lastLogin: number;
}

export function AdminPage() {
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserConfig | null>(null);

  // State form menampung field profil dan input password untuk registrasi baru
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', 
    role: 'operator',
    devices: 'GreenFlow-001',
  });

  // Listener Real-Time dari Cloud Firestore Collection 'users'
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersList: UserConfig[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'operator',
          devices: data.devices || ['GreenFlow-001'],
          status: data.status || 'offline',
          lastLogin: data.lastLogin || Date.now(),
        });
      });
      setUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'operator', devices: 'GreenFlow-001' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserConfig) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Kosongkan password saat mode edit profil
      role: user.role,
      devices: Array.isArray(user.devices) ? user.devices.join(', ') : 'GreenFlow-001',
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini dari database? (Catatan: Ini menghapus data profil dari Firestore)')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting user: ", error);
        alert("Gagal menghapus pengguna.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return alert('Nama dan Email wajib diisi!');
    
    // Validasi kekuatan password minimal dari Firebase Auth untuk pendaftaran baru
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      return alert('Password wajib diisi minimal 6 karakter!');
    }

    try {
      let userId = editingUser ? editingUser.id : null;

      // 🔐 PROSES REGISTRASI KE FIREBASE AUTHENTICATION (Hanya jika membuat akun baru)
      if (!editingUser) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        userId = userCredential.user.uid; // Ikat UID Firebase Auth menjadi ID dokumen Firestore
      }

      if (!userId) return alert('Terjadi kegagalan pembuatan ID Pengguna.');

      // PROSES PENYIMPANAN DATA PROFIL KE FIRESTORE
      const userPayload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        devices: formData.devices.split(',').map(d => d.trim()),
        status: editingUser ? editingUser.status : 'offline',
        lastLogin: editingUser ? editingUser.lastLogin : Date.now(),
      };

      await setDoc(doc(db, 'users', userId), userPayload, { merge: true });
      setIsModalOpen(false);
      alert(editingUser ? 'Akun berhasil diperbarui!' : 'Akun baru berhasil diregistrasikan ke Firebase!');
    } catch (error: any) {
      console.error("Error saving user: ", error);
      alert(`Gagal memproses data: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Admin</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manajemen pengguna dan keamanan sistem</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistik Pengguna */}
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Statistik Pengguna</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Total Pengguna</span>
              <span className="font-bold text-surface-900 dark:text-surface-100">{isLoading ? '...' : users.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Admin</span>
              <span className="font-bold text-surface-900 dark:text-surface-100">{users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Operator</span>
              <span className="font-bold text-surface-900 dark:text-surface-100">{users.filter(u => u.role === 'operator').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Viewer</span>
              <span className="font-bold text-surface-900 dark:text-surface-100">{users.filter(u => u.role === 'viewer').length}</span>
            </div>
          </div>
        </div>

        {/* Daftar Pengguna */}
        <div className="lg:col-span-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Daftar Pengguna</h3>
            <button 
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              + Tambah
            </button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-6 text-xs font-bold text-surface-400 animate-pulse">Memuat data pengguna dari cloud Firestore...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left py-3 px-4 font-medium text-surface-500">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-surface-500">Email</th>
                    <th className="text-center py-3 px-4 font-medium text-surface-500">Role</th>
                    <th className="text-center py-3 px-4 font-medium text-surface-500">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-xs text-surface-400">Belum ada akun terdaftar di Firestore.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-700 dark:text-primary-300">{(u.name || 'U').charAt(0)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-surface-900 dark:text-surface-100">{u.name}</span>
                              <span className="text-xs text-surface-400 ml-2">{Array.isArray(u.devices) ? u.devices.join(', ') : u.devices}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-surface-600 dark:text-surface-400">{u.email}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            'badge',
                            u.role === 'admin' ? 'badge-danger' : u.role === 'operator' ? 'badge-info' : 'badge-gray'
                          )}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'operator' ? 'Operator' : 'Viewer'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn('inline-flex items-center gap-1 text-xs', u.status === 'online' ? 'text-green-600' : 'text-surface-400')}>
                            <span className={cn('inline-block w-1.5 h-1.5 rounded-full', u.status === 'online' ? 'bg-green-500' : 'bg-surface-400')} />
                            {u.status === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEditModal(u)}
                              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Form Tambah (Registrasi) / Edit Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 text-surface-900 dark:text-surface-100">
            <h3 className="text-lg font-bold">
              {editingUser ? '✏️ Edit Profil Pengguna' : '➕ Registrasi Akun Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="Contoh: Nurlaela K."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser} // Email tidak boleh diubah jika dalam mode edit untuk menjaga konsistensi Auth
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500 disabled:opacity-50"
                  placeholder="nama@greenflow.id"
                />
              </div>

              {/* 🔐 INPUT PASSWORD: Hanya muncul ketika membuat akun baru */}
              {!editingUser && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Password Akun</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Hak Akses (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500 text-surface-900 dark:text-surface-200"
                >
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Alokasi Node Device</label>
                <input
                  type="text"
                  value={formData.devices}
                  onChange={(e) => setFormData({ ...formData, devices: e.target.value })}
                  className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="GreenFlow-001"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase rounded-xl border border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md transition-colors"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bagian Bawah Firmware & Keamanan Sistem Tetap Dipertahankan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Keamanan Multi-Admin</h3>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="font-medium text-green-800 dark:text-green-300">Sistem Aman</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              Hanya akun admin yang terdaftar yang dapat mengakses sistem. Perintah dari pihak luar akan ditolak otomatis.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Firmware & Sistem</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Versi Firmware</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">v2.4.1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">ESP32 Core</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">Dual-Core FreeRTOS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Frekuensi</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">240 MHz</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Free Heap</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">128 KB / 320 KB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Auto Restart</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">Setiap 05:00 WIB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Arsitektur</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">Dual-Core (Firebase Core 0, Sensor Core 1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}