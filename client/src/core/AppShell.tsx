import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useOrientation } from './hooks/useOrientation';
import { useWebSocket } from '../hooks/useWebSocket';
import { APP_SETTINGS_KEY } from './hooks/useAppSettings';
import useAudioChime from '../alerts/useAudioChime';
import { unlockAudioContext } from '../alerts/audioChime';
import useVoiceNavigation from '../voice/useVoiceNavigation';
import MicIndicator from '../voice/MicIndicator';
import NavBar from './NavBar';
import FilterPanel from './FilterPanel';
import KioskOverlay from './KioskOverlay';
import GuestOverlay from './GuestOverlay';
import IdleOverlay from './IdleOverlay';

export default function AppShell() {
  const orientation = useOrientation();
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useAudioChime();
  useVoiceNavigation();

  useEffect(() => {
    const unlock = () => unlockAudioContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

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
      <MicIndicator />
      <KioskOverlay />
      <GuestOverlay />
      <IdleOverlay />
    </div>
  );
}
