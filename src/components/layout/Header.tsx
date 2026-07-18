import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../../stores/index';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Sun, Moon, LogOut, ChevronDown, Leaf, Sliders, ShieldCheck 
} from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error logging out:', err);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-6 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      
      {/* Branding Logo & Title for Mobile/Tablet */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
          <Leaf className="w-4 h-4" />
        </div>
        <span className="font-bold text-base text-surface-900 dark:text-white">GreenFlow</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        
        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-150 dark:hover:bg-surface-950 transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-800"
          title="Toggle tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-650" />
          )}
        </button>

        {/* Profile Dropdown Trigger */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 pl-2.5 py-1.5 pr-2 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-950 border border-transparent hover:border-surface-200 dark:hover:border-surface-800 transition-all select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-750 dark:text-primary-350 font-black text-xs border border-primary-200/50 dark:border-primary-800/40">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-extrabold text-surface-900 dark:text-white leading-tight">
                  {user.displayName || 'Operator'}
                </p>
                <p className="text-[9px] font-black text-surface-450 dark:text-surface-400 capitalize tracking-wider leading-none mt-0.5">
                  {user.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>

            {/* Premium Dropdown Panel */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl py-2 z-50 animate-fade-in text-xs font-semibold text-surface-700 dark:text-surface-300">
                
                {/* Popover User Info */}
                <div className="px-4 py-2 border-b border-surface-150 dark:border-surface-850 space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Sesi Aktif</span>
                  <span className="font-bold text-surface-900 dark:text-white block truncate">{user.displayName || 'Operator'}</span>
                  <span className="text-[10px] text-surface-450 dark:text-surface-400 truncate block">{user.email}</span>
                </div>

                {/* Popover Action Links */}
                <div className="p-1.5 border-b border-surface-150 dark:border-surface-850 space-y-0.5">
                  <div className="px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-950 rounded-xl cursor-default flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Hak Akses: <strong className="capitalize text-emerald-600 dark:text-emerald-450">{user.role}</strong></span>
                  </div>
                  
                  <a 
                    href="/pengaturan-alat" 
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-950 rounded-xl flex items-center gap-2 transition"
                  >
                    <Sliders className="w-4 h-4 text-primary-500" />
                    <span>Pengaturan Alat</span>
                  </a>
                </div>

                {/* Popover Logout Action */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}