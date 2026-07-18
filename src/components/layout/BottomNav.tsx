import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/index';
import { LayoutDashboard, CalendarDays, LineChart, Sliders, ShieldAlert } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin', 'operator', 'viewer'],
  },
  {
    name: 'Jadwal',
    href: '/jadwal',
    icon: <CalendarDays className="w-5 h-5" />,
    roles: ['admin', 'operator'],
  },
  {
    name: 'Analisis',
    href: '/analisis',
    icon: <LineChart className="w-5 h-5" />,
    roles: ['admin', 'operator', 'viewer'],
  },
  {
    name: 'Pengaturan',
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

export function BottomNav() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const filteredNav = navigation.filter((item) => user ? item.roles.includes(user.role) : true);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-900/95 backdrop-blur-md border-t border-surface-200 dark:border-surface-800 shadow-lg px-2 pb-safe-bottom">
      <nav className="flex justify-around items-center h-16 max-w-md mx-auto">
        {filteredNav.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 px-1 text-center transition-all duration-200',
                active
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-colors',
                active ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-transparent'
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate w-full max-w-[70px]">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
