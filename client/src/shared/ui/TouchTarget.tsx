import React from 'react';
import clsx from 'clsx';

interface TouchTargetProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export default function TouchTarget({
  as: Tag = 'button',
  children,
  className,
  ...props
}: TouchTargetProps) {
  return (
    <Tag
      className={clsx('inline-flex min-h-11 min-w-11 items-center justify-center', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
