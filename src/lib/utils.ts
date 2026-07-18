import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '--';
  return value.toFixed(decimals);
}

export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

export function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateTime(date: Date | string | number): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(d);
}

export function calculateVPD(tempC: number, humidityPercent: number): number {
  // VPD in kPa
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const avp = svp * (humidityPercent / 100);
  return Math.round((svp - avp) * 100) / 100;
}

export function getVPDStatus(vpd: number): 'low' | 'optimal' | 'high' {
  if (vpd < 0.5) return 'low';
  if (vpd > 1.6) return 'high';
  return 'optimal';
}

export function getBatteryStatus(voltage: number): 'critical' | 'low' | 'good' | 'full' {
  if (voltage < 11.5) return 'critical';
  if (voltage < 12.0) return 'low';
  if (voltage < 13.5) return 'good';
  return 'full';
}

export function voltageToPercent(voltage: number, minV = 11.0, maxV = 14.5): number {
  const percent = ((voltage - minV) / (maxV - minV)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function getSignalStrength(rssi: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rssi > -50) return 'excellent';
  if (rssi > -65) return 'good';
  if (rssi > -80) return 'fair';
  return 'poor';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function parseSensorValue(value: unknown, defaultValue = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function isOnline(lastSeen: number, thresholdMs = 60000): boolean {
  return Date.now() - lastSeen < thresholdMs;
}

export function getChartTimeFormat(range: string): Intl.DateTimeFormatOptions {
  switch (range) {
    case '1h':
      return { hour: '2-digit', minute: '2-digit' };
    case '6h':
      return { hour: '2-digit', minute: '2-digit' };
    case '24h':
      return { hour: '2-digit', minute: '2-digit' };
    case '7d':
      return { day: '2-digit', month: '2-digit' };
    case '30d':
      return { day: '2-digit', month: '2-digit' };
    default:
      return { hour: '2-digit', minute: '2-digit' };
  }
}

export function getChartInterval(range: string): number {
  switch (range) {
    case '1h':
      return 60000; // 1 minute
    case '6h':
      return 300000; // 5 minutes
    case '24h':
      return 900000; // 15 minutes
    case '7d':
      return 3600000; // 1 hour
    case '30d':
      return 86400000; // 1 day
    default:
      return 900000;
  }
}