import clsx from 'clsx';
import React from 'react';

interface PillProps {
  children: React.ReactNode;
  colour?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function Pill({ children, colour, icon, className }: PillProps) {
  const style = colour ? { backgroundColor: `${colour}22`, color: colour } : undefined;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-medium',
        !colour && 'bg-surface-elev text-secondary',
        className,
      )}
      style={style}
    >
      {icon && (
        <span aria-hidden="true" className="flex-shrink-0 leading-none">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
