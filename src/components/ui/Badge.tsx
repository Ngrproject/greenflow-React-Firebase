import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const variants = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ variant = 'gray', size = 'md', className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: 'online' | 'offline' | 'error' | 'warning';
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-surface-400',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      colors[status],
      status === 'online' && 'animate-pulse',
      className
    )} />
  );
}

interface KPIProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { direction: 'up' | 'down'; value: string };
  status?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function KPI({ label, value, unit, icon, trend, status, className }: KPIProps) {
  const statusColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    danger: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  };

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all hover:shadow-md',
      status ? statusColors[status] : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-surface-600 dark:text-surface-400">{label}</span>
        {icon && <span className="text-surface-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</span>
        {unit && <span className="text-sm text-surface-500 dark:text-surface-400">{unit}</span>}
      </div>
      {trend && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.direction === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
          </svg>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
        )}
      >
        <span className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200',
          checked ? 'translate-x-4' : 'translate-x-0'
        )} />
      </button>
      {label && <span className="text-sm text-surface-700 dark:text-surface-300">{label}</span>}
    </label>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, color = 'primary', size = 'md', showLabel, className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary: 'bg-primary-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{Math.round(percent)}%</span>}
    </div>
  );
}