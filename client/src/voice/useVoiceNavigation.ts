import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

const MODE_ROUTES: Record<string, string> = {
  home: '/',
  calendar: '/calendar',
  food: '/food',
  family: '/family',
  house: '/house',
  finance: '/finance',
  pets: '/pets',
  ev: '/ev',
  board: '/board',
  contacts: '/contacts',
  vehicles: '/vehicles',
};

/**
 * Listens for nav:goto and nav:date WebSocket events from the voice router
 * and performs client-side navigation.
 */
export default function useVoiceNavigation(): void {
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.event === 'nav:goto') {
      const { mode } = lastMessage.payload as { mode: string };
      const route = MODE_ROUTES[mode];
      if (route) {
        void navigate(route);
      }
    }

    if (lastMessage.event === 'nav:date') {
      const { date } = lastMessage.payload as { date: string };
      void navigate(`/calendar?date=${date}`);
    }
  }, [lastMessage, navigate]);
}
