import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-surface-300 dark:border-surface-600',
        'bg-white dark:bg-surface-900',
        'px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100',
        'placeholder:text-surface-400 dark:placeholder:text-surface-500',
        'transition-all duration-200',
        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-surface-300 dark:border-surface-600',
        'bg-white dark:bg-surface-900',
        'px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100',
        'placeholder:text-surface-400 dark:placeholder:text-surface-500',
        'transition-all duration-200',
        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'resize-y min-h-[80px]',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-surface-300 dark:border-surface-600',
        'bg-white dark:bg-surface-900',
        'px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100',
        'transition-all duration-200',
        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'appearance-none bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10',
        className
      )}
      {...props}
    />
  )
);

Select.displayName = 'Select';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  )
);

Label.displayName = 'Label';

export const InputGroup = ({ label, error, hint, children, required, ...props }: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) => (
  <div {...props}>
    {label && <Label required={required}>{label}</Label>}
    {children}
    {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    {hint && !error && <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{hint}</p>}
  </div>
);