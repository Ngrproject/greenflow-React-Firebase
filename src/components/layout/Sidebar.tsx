import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/index';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, CalendarDays, LineChart, Sliders, ShieldAlert,
  ChevronLeft, LogOut, Leaf, Bell // 🔔 Tambahkan ikon Bell di sini
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin', 'operator', 'viewer'],
  },
  {
    name: 'Jadwal Penyiraman',
    href: '/jadwal',
    icon: <CalendarDays className="w-5 h-5" />,
    roles: ['admin', 'operator'],
  },
  {
    name: 'Analisis & Laporan',
    href: '/analisis',
    icon: <LineChart className="w-5 h-5" />,
    roles: ['admin', 'operator', 'viewer'],
  },
 {
  name: 'Notifikasi',
  href: '/notifikasi',
  icon: <Bell className="w-5 h-5" />, // 🌟 Hapus text-sky-500 di sini biar warnanya ngikutin tema class bawaan group NavLink
  roles: ['admin', 'operator', 'viewer'],
},
  {
    name: 'Pengaturan Alat',
    href: '/pengaturan-alat',
    icon: <Sliders className="w-5 h-5" />,
    roles: ['admin', 'operator'],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: <ShieldAlert className="w-5 h-5" />,
    roles: ['admin'],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

export function Sidebar({ collapsed, onToggleCollapse, onClose, isMobile }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

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
    <aside className={cn(
      'flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-all duration-300 z-40',
      isMobile 
        ? (collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64 fixed inset-y-0 left-0 shadow-xl')
        : (collapsed ? 'w-20' : 'w-64')
    )}>
      
      {/* Sidebar Header Brand */}
      <div className={cn(
        'flex items-center h-16 px-5 border-b border-surface-200 dark:border-surface-800',
        collapsed && 'justify-center px-0'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight text-surface-900 dark:text-white tracking-tight">GreenFlow</span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary-500 dark:text-primary-400">OPERATIONAL</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <Leaf className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
        {navigation
          .filter((item) => user ? item.roles.includes(user.role) : true)
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => isMobile && onClose()}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-200 group relative',
                isActive(item.href)
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/40 shadow-sm'
                  : 'text-surface-500 dark:text-surface-450 hover:bg-surface-50 dark:hover:bg-surface-950 hover:text-surface-900 dark:hover:text-surface-150 border border-transparent'
              )}
            >
              <div className="shrink-0 transition-transform group-hover:scale-105">
                {item.icon}
              </div>
              {!collapsed && <span className="truncate">{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-surface-900 dark:bg-surface-100 text-surface-100 dark:text-surface-900 text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-surface-800 dark:border-surface-200">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Profile Card Footer */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-800 space-y-3">
        {user && (
          <div className={cn(
            'flex items-center gap-3 rounded-2xl bg-surface-50 dark:bg-surface-950 p-3 border border-surface-100 dark:border-surface-850 transition-all',
            collapsed ? 'justify-center p-2' : 'justify-between'
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shrink-0 border border-primary-200/50 dark:border-primary-800/40">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-extrabold text-surface-900 dark:text-white truncate">
                    {user.displayName || 'Operator'}
                  </span>
                  <span className="text-[9px] font-black text-surface-450 dark:text-surface-400 capitalize tracking-wider">
                    {user.role}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-surface-450 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Keluar dari Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {collapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-surface-900 dark:bg-surface-100 text-surface-100 dark:text-surface-900 text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-surface-800 dark:border-surface-200 flex flex-col gap-1">
                <span>{user.displayName || 'Operator'} ({user.role})</span>
                <button 
                  onClick={handleLogout} 
                  className="text-[10px] text-rose-500 dark:text-rose-600 hover:underline text-left mt-1 font-black flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" /> Keluar Akun
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapse Button Trigger */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold text-surface-500 dark:text-surface-450 hover:bg-surface-50 dark:hover:bg-surface-950 hover:text-surface-900 dark:hover:text-white transition-colors border border-transparent hover:border-surface-150 dark:hover:border-surface-850',
              collapsed && 'px-0'
            )}
            title={collapsed ? 'Perluas Sidebar' : 'Sembunyikan'}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
            {!collapsed && <span>Sembunyikan Menu</span>}
          </button>
        )}
      </div>
    </aside>
  );
}