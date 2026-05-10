import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useOrientation } from './hooks/useOrientation';
import { useWebSocket } from '../hooks/useWebSocket';
import { APP_SETTINGS_KEY } from './hooks/useAppSettings';
import NavBar from './NavBar';
import FilterPanel from './FilterPanel';
import KioskOverlay from './KioskOverlay';

export default function AppShell() {
  const orientation = useOrientation();
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lastMessage?.event === 'settings:updated') {
      void queryClient.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    }
  }, [lastMessage, queryClient]);

  return (
    <div className={clsx('app-shell', `app-shell--${orientation}`)} data-orientation={orientation}>
      <NavBar />
      <FilterPanel />
      <Outlet />
      <KioskOverlay />
    </div>
  );
}
