import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'h-4 rounded-full bg-surface-elev animate-pulse motion-reduce:animate-none',
        className,
      )}
    />
  );
}

export default function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) return <SkeletonLine className={className} />;
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} className={i === lines - 1 ? 'w-2/3' : undefined} />
      ))}
    </div>
  );
}
