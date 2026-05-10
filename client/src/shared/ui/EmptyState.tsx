import React from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  body?: string;
  cta?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, heading, body, cta, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center gap-3 py-12 text-center', className)}>
      {icon && (
        <span aria-hidden="true" className="text-5xl text-muted leading-none">
          {icon}
        </span>
      )}
      <h3 className="text-h2 font-semibold text-primary">{heading}</h3>
      {body && <p className="max-w-sm text-body text-secondary">{body}</p>}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
