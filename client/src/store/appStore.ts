import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface AppState {
  activeProfileId: string | null;
  adminPin: string | null;
  alertCount: number;
  voiceStatus: VoiceStatus;
  badgeCounts: Record<string, number>;
  badgeSeverities: Record<string, string>;
  guestProfileId: string | null;

  setActiveProfile: (profileId: string | null, adminPin?: string | null) => void;
  setAlertCount: (count: number) => void;
  setVoiceStatus: (status: VoiceStatus) => void;
  setBadgeCount: (modeId: string, count: number) => void;
  setBadgeSeverity: (modeId: string, severity: string) => void;
  setGuestMode: (profileId: string | null) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProfileId: null,
      adminPin: null,
      alertCount: 0,
      voiceStatus: 'idle' as VoiceStatus,
      badgeCounts: {},
      badgeSeverities: {},
      guestProfileId: null,

      setActiveProfile: (profileId, adminPin = null) =>
        set({ activeProfileId: profileId, adminPin }),

      setAlertCount: (count) => set({ alertCount: count }),

      setVoiceStatus: (status) => set({ voiceStatus: status }),

      setBadgeCount: (modeId, count) =>
        set((s) => ({ badgeCounts: { ...s.badgeCounts, [modeId]: count } })),

      setBadgeSeverity: (modeId, severity) =>
        set((s) => ({ badgeSeverities: { ...s.badgeSeverities, [modeId]: severity } })),

      setGuestMode: (profileId) => set({ guestProfileId: profileId }),
    }),
    {
      name: 'nestor-app',
      partialize: (s) => ({ activeProfileId: s.activeProfileId }),
    },
  ),
);

export default useAppStore;
