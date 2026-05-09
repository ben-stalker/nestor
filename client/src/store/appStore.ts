import { create } from 'zustand';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface AppState {
  activeProfileId: string | null;
  adminPin: string | null;
  alertCount: number;
  voiceStatus: VoiceStatus;

  setActiveProfile: (profileId: string | null, adminPin?: string | null) => void;
  setAlertCount: (count: number) => void;
  setVoiceStatus: (status: VoiceStatus) => void;
}

const useAppStore = create<AppState>((set) => ({
  activeProfileId: null,
  adminPin: null,
  alertCount: 0,
  voiceStatus: 'idle',

  setActiveProfile: (profileId, adminPin = null) => set({ activeProfileId: profileId, adminPin }),

  setAlertCount: (count) => set({ alertCount: count }),

  setVoiceStatus: (status) => set({ voiceStatus: status }),
}));

export default useAppStore;
