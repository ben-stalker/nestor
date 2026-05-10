import { forwardRef } from 'react';
import clsx from 'clsx';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      className={clsx(
        'inline-flex h-11 w-11 items-center justify-center rounded-button text-primary',
        'transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  ),
);
IconButton.displayName = 'IconButton';
export default IconButton;
