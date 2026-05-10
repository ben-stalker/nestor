import clsx from 'clsx';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  colour?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-base',
} as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function Avatar({ name, src, size = 'md', colour, className }: AvatarProps) {
  return (
    <span
      aria-label={name}
      className={clsx(
        'inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-surface-elev font-semibold text-primary',
        sizeMap[size],
        className,
      )}
      style={colour ? { borderColor: colour } : undefined}
    >
      {src ? <img alt={name} className="h-full w-full object-cover" src={src} /> : initials(name)}
    </span>
  );
}
