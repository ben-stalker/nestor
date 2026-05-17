import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useOrientation } from './hooks/useOrientation';
import { useAppSettings } from './hooks/useAppSettings';
import useAppStore from '../store/appStore';
import Modal from '../shared/ui/Modal';
import apiFetch from '../api/client';
import { DEFAULT_NAV_MODES, NAV_MODE_MAP, NAV_MODE_PERMISSION } from './navModes';
import type { NavMode } from './navModes';
import { useBadgeCounts, useMarkRead } from '../hooks/useAlerts';

const SEVERITY_COLOR: Record<string, string> = {
  error: 'bg-alert-urgent',
  warning: 'bg-alert-warning',
  info: 'bg-alert-info',
};

interface NavButtonProps {
  mode: NavMode;
  compact?: boolean;
  onClick?: () => void;
}

function NavButton({ mode, compact = false, onClick }: NavButtonProps) {
  const badge = useAppStore((s) => s.badgeCounts[mode.id] ?? 0);
  const severity = useAppStore((s) => s.badgeSeverities[mode.id] ?? 'error');
  const badgeColor = SEVERITY_COLOR[severity] ?? 'bg-alert-urgent';
  const accentColor = `var(--color-${mode.accent})`;
  const markRead = useMarkRead();

  function handleClick() {
    if (badge > 0) {
      markRead.mutate(mode.id);
    }
    onClick?.();
  }

  return (
    <NavLink
      to={mode.route}
      end={mode.route === '/'}
      onClick={handleClick}
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
                className={clsx(
                  'absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white',
                  badgeColor,
                )}
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

function BadgeCountsSyncer() {
  const { data: badgeCounts } = useBadgeCounts();
  const setBadgeCount = useAppStore((s) => s.setBadgeCount);
  const setBadgeSeverity = useAppStore((s) => s.setBadgeSeverity);

  useEffect(() => {
    if (!badgeCounts) return;
    Object.entries(badgeCounts).forEach(([modeId, info]) => {
      setBadgeCount(modeId, info.count);
      setBadgeSeverity(modeId, info.severity);
    });
  }, [badgeCounts, setBadgeCount, setBadgeSeverity]);

  return null;
}

export default function NavBar() {
  const orientation = useOrientation();
  const { data: settings } = useAppSettings();
  const [moreOpen, setMoreOpen] = useState(false);

  const kioskProfileId = settings?.kiosk_lock ?? null;

  const { data: kioskPermissions } = useQuery<Record<string, boolean>>({
    queryKey: ['profile-permissions', kioskProfileId],
    queryFn: () =>
      apiFetch<Record<string, boolean>>(`/api/v1/profiles/${kioskProfileId}/permissions`),
    enabled: kioskProfileId !== null,
    staleTime: 60_000,
  });

  const enabledIds: string[] = settings?.enabled_nav_modes ?? DEFAULT_NAV_MODES.map((m) => m.id);
  const layout = settings?.nav_layout ?? 'scrollable';

  const allModes = enabledIds.flatMap((id) => {
    const mode = NAV_MODE_MAP.get(id);
    return mode ? [mode] : [];
  });

  const modes = kioskProfileId
    ? allModes.filter((mode) => {
        const permKey = NAV_MODE_PERMISSION[mode.id];
        if (!permKey) return true;
        return kioskPermissions ? Boolean(kioskPermissions[permKey]) : false;
      })
    : allModes;

  // Landscape: vertical side rail
  if (orientation === 'landscape') {
    return (
      <>
        <BadgeCountsSyncer />
        <nav
          className="rail flex flex-col overflow-y-auto border-r border-surface-elev bg-surface py-2"
          aria-label="Main navigation"
        >
          {modes.map((mode) => (
            <NavButton key={mode.id} mode={mode} compact />
          ))}
        </nav>
      </>
    );
  }

  // Portrait hamburger: 4 visible + More sheet
  if (layout === 'hamburger') {
    const visible = modes.slice(0, 4);
    const overflow = modes.slice(4);
    return (
      <>
        <BadgeCountsSyncer />
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
      </>
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
    <>
      <BadgeCountsSyncer />
      <nav className={navClass} aria-label="Main navigation">
        {modes.map((mode) => (
          <NavButton key={mode.id} mode={mode} />
        ))}
      </nav>
    </>
  );
}
