import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface AppState {
  activeProfileId: string | null;
  adminPin: string | null;
  alertCount: number;
  voiceStatus: VoiceStatus;
  badgeCounts: Record<string, number>;

  setActiveProfile: (profileId: string | null, adminPin?: string | null) => void;
  setAlertCount: (count: number) => void;
  setVoiceStatus: (status: VoiceStatus) => void;
  setBadgeCount: (modeId: string, count: number) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProfileId: null,
      adminPin: null,
      alertCount: 0,
      voiceStatus: 'idle' as VoiceStatus,
      badgeCounts: {},

      setActiveProfile: (profileId, adminPin = null) =>
        set({ activeProfileId: profileId, adminPin }),

      setAlertCount: (count) => set({ alertCount: count }),

      setVoiceStatus: (status) => set({ voiceStatus: status }),

      setBadgeCount: (modeId, count) =>
        set((s) => ({ badgeCounts: { ...s.badgeCounts, [modeId]: count } })),
    }),
    {
      name: 'nestor-app',
      partialize: (s) => ({ activeProfileId: s.activeProfileId }),
    },
  ),
);

export default useAppStore;
