import { forwardRef } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantMap = {
  primary: 'bg-mode-home text-white hover:opacity-90',
  secondary: 'bg-surface-elev text-primary hover:opacity-80',
  ghost: 'bg-transparent text-primary hover:bg-surface-elev',
  danger: 'bg-alert-urgent text-white hover:opacity-90',
} as const;

const sizeMap = {
  sm: 'px-3 py-1.5 text-caption',
  md: 'px-5 py-2.5 text-body',
  lg: 'px-7 py-3.5 text-body',
} as const;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-button font-medium transition-opacity',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variantMap[variant],
        sizeMap[size],
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
export default Button;
