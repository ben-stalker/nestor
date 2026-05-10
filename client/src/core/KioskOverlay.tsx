import { useState, useCallback, useRef } from 'react';
import { Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSettings, APP_SETTINGS_KEY } from './hooks/useAppSettings';
import { unlockKiosk } from '../api/admin';
import AdminPinPrompt from '../shared/ui/AdminPinPrompt';

const TRIPLE_TAP_WINDOW_MS = 800;

export default function KioskOverlay() {
  const { data: settings } = useAppSettings();
  const queryClient = useQueryClient();
  const [showPrompt, setShowPrompt] = useState(false);
  const tapTimestamps = useRef<number[]>([]);

  const isLocked = Boolean(settings?.kiosk_lock);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current = [...tapTimestamps.current, now].filter(
      (t) => now - t < TRIPLE_TAP_WINDOW_MS,
    );
    if (tapTimestamps.current.length >= 3) {
      tapTimestamps.current = [];
      setShowPrompt(true);
    }
  }, []);

  function handleUnlockSuccess() {
    setShowPrompt(false);
    void queryClient.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
  }

  if (!isLocked) return null;

  return (
    <>
      {/* Lock indicator — top-left corner */}
      <div
        className="kiosk-lock-indicator"
        role="status"
        aria-label="Screen is locked in kiosk mode"
      >
        <Lock size={14} aria-hidden="true" />
      </div>

      {/* Hidden triple-tap corner target — bottom-right; tabIndex=-1 keeps it off keyboard nav */}
      <button
        type="button"
        className="kiosk-tap-target"
        aria-label="Admin unlock"
        tabIndex={-1}
        onClick={handleTap}
      />

      {showPrompt && (
        <AdminPinPrompt
          title="Admin PIN to unlock"
          onVerify={unlockKiosk}
          onSuccess={handleUnlockSuccess}
          onClose={() => setShowPrompt(false)}
        />
      )}
    </>
  );
}
