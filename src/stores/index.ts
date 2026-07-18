import { create } from 'zustand';
import type { User, SensorData, ActuatorState, DeviceConfig, Alert, SystemStatus } from '../types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

interface DeviceState {
  deviceId: string;
  liveData: SensorData | null;
  actuatorState: ActuatorState | null;
  config: DeviceConfig | null;
  systemStatus: SystemStatus | null;
  alerts: Alert[];
  history: SensorData[];
  connected: boolean;
  lastUpdate: number | null;
  
  setDeviceId: (id: string) => void;
  setLiveData: (data: SensorData) => void;
  setActuatorState: (state: ActuatorState) => void;
  setConfig: (config: DeviceConfig) => void;
  setSystemStatus: (status: SystemStatus) => void;
  setConnected: (connected: boolean) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  addHistoryPoint: (point: SensorData) => void;
  setHistory: (history: SensorData[]) => void;
  clearHistory: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceId: import.meta.env.VITE_DEVICE_ID || 'greenflow-001',
  liveData: null,
  actuatorState: null,
  config: null,
  systemStatus: null,
  alerts: [],
  history: [],
  connected: false,
  lastUpdate: null,

  setDeviceId: (id) => set({ deviceId: id }),
  
  setLiveData: (data) => set({ 
    liveData: data, 
    lastUpdate: Date.now(),
    connected: true 
  }),
  
  setActuatorState: (state) => set({ actuatorState: state }),
  
  setConfig: (config) => set({ config }),
  
  setSystemStatus: (status) => set({ systemStatus: status }),
  
  setConnected: (connected) => set({ connected }),
  
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts].slice(0, 100) 
  })),
  
  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((a) => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ),
  })),
  
  addHistoryPoint: (point) => set((state) => ({
    history: [...state.history, point].slice(-1440), // Keep last 24h at 1min intervals
  })),
  
  setHistory: (history) => set({ history }),
  
  clearHistory: () => set({ history: [] }),
}));

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  activePage: string;
  toasts: Toast[];
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setActivePage: (page: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system',
  activePage: 'dashboard',
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setActivePage: (page) => set({ activePage: page }),
  
  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 5000;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
  },
  
  removeToast: (id) => set((state) => ({ 
    toasts: state.toasts.filter((t) => t.id !== id) 
  })),
}));