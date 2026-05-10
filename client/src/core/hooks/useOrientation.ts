import { useState, useEffect } from 'react';
import { useAppSettings } from './useAppSettings';

export type Orientation = 'portrait' | 'landscape';

function getMediaOrientation(): Orientation {
  return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
}

export function useOrientation(): Orientation {
  const { data } = useAppSettings();
  const setting = data?.orientation ?? 'auto';

  const [media, setMedia] = useState<Orientation>(getMediaOrientation);

  useEffect(() => {
    if (setting !== 'auto') return undefined;

    const mq = window.matchMedia('(orientation: portrait)');
    const handler = () => setMedia(mq.matches ? 'portrait' : 'landscape');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setting]);

  return setting === 'auto' ? media : setting;
}
