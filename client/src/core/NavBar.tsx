import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { useOrientation } from './hooks/useOrientation';
import { useAppSettings } from './hooks/useAppSettings';
import useAppStore from '../store/appStore';
import Modal from '../shared/ui/Modal';
import { DEFAULT_NAV_MODES, NAV_MODE_MAP } from './navModes';
import type { NavMode } from './navModes';

interface NavButtonProps {
  mode: NavMode;
  compact?: boolean;
  onClick?: () => void;
}

function NavButton({ mode, compact = false, onClick }: NavButtonProps) {
  const badge = useAppStore((s) => s.badgeCounts[mode.id] ?? 0);
  const accentColor = `var(--color-${mode.accent})`;

  return (
    <NavLink
      to={mode.route}
      end={mode.route === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 transition-colors',
          compact ? 'text-[11px]' : 'text-caption',
          isActive ? 'font-semibold' : 'text-secondary',
        )
      }
      style={({ isActive }) => (isActive ? { color: accentColor } : undefined)}
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <mode.Icon size={28} strokeWidth={1.5} />
            {badge > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert-urgent px-1 text-[10px] font-bold text-white"
                aria-label={`${badge} unread`}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </span>
          <span className="leading-none" style={isActive ? { color: accentColor } : undefined}>
            {mode.label}
          </span>
          {isActive && (
            <span
              className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function NavBar() {
  const orientation = useOrientation();
  const { data: settings } = useAppSettings();
  const [moreOpen, setMoreOpen] = useState(false);

  const enabledIds: string[] = settings?.enabled_nav_modes ?? DEFAULT_NAV_MODES.map((m) => m.id);
  const layout = settings?.nav_layout ?? 'scrollable';

  const modes = enabledIds.flatMap((id) => {
    const mode = NAV_MODE_MAP.get(id);
    return mode ? [mode] : [];
  });

  // Landscape: vertical side rail
  if (orientation === 'landscape') {
    return (
      <nav
        className="rail flex flex-col overflow-y-auto border-r border-surface-elev bg-surface py-2"
        aria-label="Main navigation"
      >
        {modes.map((mode) => (
          <NavButton key={mode.id} mode={mode} compact />
        ))}
      </nav>
    );
  }

  // Portrait hamburger: 4 visible + More sheet
  if (layout === 'hamburger') {
    const visible = modes.slice(0, 4);
    const overflow = modes.slice(4);
    return (
      <nav
        className="navbar flex items-center justify-around border-t border-surface-elev bg-surface px-2 py-1"
        aria-label="Main navigation"
      >
        {visible.map((mode) => (
          <NavButton key={mode.id} mode={mode} />
        ))}
        {overflow.length > 0 && (
          <>
            <button
              onClick={() => setMoreOpen(true)}
              className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-caption text-secondary"
              aria-label="More navigation options"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={28} strokeWidth={1.5} />
              <span className="leading-none">More</span>
            </button>
            <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
              <div className="grid grid-cols-4 gap-2">
                {overflow.map((mode) => (
                  <NavButton key={mode.id} mode={mode} onClick={() => setMoreOpen(false)} />
                ))}
              </div>
            </Modal>
          </>
        )}
      </nav>
    );
  }

  // Portrait single / double / scrollable
  const layoutClass: Record<string, string> = {
    double: 'grid grid-cols-5 grid-rows-2',
    single: 'flex justify-around',
    scrollable: 'flex overflow-x-auto',
  };
  const navClass = clsx(
    'navbar border-t border-surface-elev bg-surface px-2 py-1',
    layoutClass[layout] ?? 'flex overflow-x-auto',
  );

  return (
    <nav className={navClass} aria-label="Main navigation">
      {modes.map((mode) => (
        <NavButton key={mode.id} mode={mode} />
      ))}
    </nav>
  );
}
