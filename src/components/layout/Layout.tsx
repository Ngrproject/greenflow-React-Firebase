import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useUIStore } from '../../stores/index';

export function Layout() {
  const { sidebarCollapsed, toggleSidebarCollapse, setSidebarOpen } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Sidebar - Only rendered on desktop */}
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onClose={() => {}}
          isMobile={false}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Header />
        
        {/* Main Content Area: Added extra bottom padding (pb-24) on mobile to clear the bottom nav bar */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 pb-24 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Only rendered on mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
}