import { forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-7' } as const;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', shadow = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'rounded-card bg-surface',
        paddingMap[padding],
        shadow && 'shadow-md',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';
export default Card;
